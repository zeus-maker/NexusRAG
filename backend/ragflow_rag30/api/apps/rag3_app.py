#
# RAG 3.0 API extension — 自动注册为 /v1/rag3/*
#
import logging

from quart import Response, request

from api.apps import current_user, login_required
from api.utils.api_utils import (
    add_tenant_id_to_kwargs,
    get_error_data_result,
    get_json_result,
    get_result,
    server_error_response,
    validate_request,
)
from rag3.index_service import (
    get_pageindex_document_tree,
    get_pageindex_hub_analytics,
    get_wiki_hub_analytics,
    list_pageindex_documents,
    list_wiki_hub_entries,
    run_index as rag3_run_index,
    search_pageindex_library,
    search_wiki_library,
    trace_index as rag3_trace_index,
)
from rag3.pageindex_hub_service import get_pageindex_settings, save_pageindex_settings
from rag3.wiki_hub_service import get_wiki_settings, save_wiki_settings
from rag3.chat_service import execute_chat_turn, execute_chat_turn_stream, format_sse
from rag3.query_parser import parse_advanced_query
from router import RouterEngine

logger = logging.getLogger(__name__)
_engine = RouterEngine()


@manager.route("/health", methods=["GET"])  # noqa: F821
async def rag3_health():
    return get_json_result(data={
        "status": "ok",
        "version": "3.0.0",
        "modules": ["router", "pipelines", "fusion", "security"],
    })


@manager.route("/classify", methods=["POST"])  # noqa: F821
@validate_request("query")
async def rag3_classify():
    try:
        body = await request.json
        query = body.get("query", "")
        roles = body.get("user_roles") or []
        plan = _engine.plan(query, roles, body.get("kb_id"))
        return get_json_result(data={
            "query": query,
            "classification": {
                "query_tier": plan.classification.query_tier,
                "doc_type": plan.classification.doc_type,
                "user_intent": plan.classification.user_intent,
                "security_tier": plan.classification.security_tier,
                "confidence": plan.classification.confidence,
            },
            "decision": {
                "primary": plan.decision.primary,
                "auxiliary": list(plan.decision.auxiliary),
                "use_fusion": plan.decision.use_fusion,
                "skip_retrieval": plan.decision.skip_retrieval,
                "reason": plan.decision.reason,
            },
            "pipeline_ids": plan.pipeline_ids,
        })
    except Exception as e:
        logger.exception("rag3_classify failed")
        return server_error_response(e)


@manager.route("/query", methods=["POST"])  # noqa: F821
@login_required
@validate_request("query")
async def rag3_query():
    """RAG3 核心查询：路由 → 多通道检索 → 融合 → LLM 生成"""
    try:
        body = await request.json
        query = body.get("query", "")
        kb_id = body.get("kb_id", "")
        if not kb_id:
            return get_error_data_result(message="kb_id is required", code=4001)

        settings = {
            "top_k": int(body.get("top_k", 10)),
            "use_rerank": body.get("use_rerank", True),
            "llm_model": body.get("llm_model") or body.get("model") or "",
            "temperature": body.get("temperature", 0.3),
            "max_tokens": body.get("max_tokens", 2048),
            "system_prompt": body.get("system_prompt") or "",
            "similarity_threshold": body.get("similarity_threshold", 0.2),
            "vector_weight": body.get("vector_weight", 0.7),
        }
        if body.get("pipeline_ids"):
            settings["pipeline_ids"] = body.get("pipeline_ids")
        if body.get("metadata_filters"):
            settings["metadata_filters"] = body.get("metadata_filters")

        result = await execute_chat_turn(
            query,
            kb_id,
            tenant_id=current_user.id,
            user_roles=body.get("user_roles") or [],
            messages=body.get("messages"),
            settings=settings,
            pipeline_ids=body.get("pipeline_ids"),
            use_llm=body.get("use_llm", True),
        )
        if result.get("error"):
            return get_error_data_result(message=result["error"], code=result.get("code", 500))

        latency = result.get("latency_ms")
        if isinstance(latency, dict):
            latency = latency.get("total", 0)

        return get_json_result(data={
            **result,
            "answer": result.get("content") or result.get("answer"),
            "latency_ms": latency,
        })
    except Exception as e:
        logger.exception("rag3_query failed")
        return server_error_response(e)


@manager.route("/query/stream", methods=["POST"])  # noqa: F821
@login_required
@validate_request("query")
async def rag3_query_stream():
    try:
        body = await request.json
        query = body.get("query", "")
        kb_id = body.get("kb_id", "")
        if not kb_id:
            return get_error_data_result(message="kb_id is required", code=4001)

        settings = {
            "top_k": int(body.get("top_k", 10)),
            "use_rerank": body.get("use_rerank", True),
            "llm_model": body.get("llm_model") or "",
            "temperature": body.get("temperature", 0.3),
            "max_tokens": body.get("max_tokens", 2048),
        }
        if body.get("pipeline_ids"):
            settings["pipeline_ids"] = body.get("pipeline_ids")

        tenant_id = current_user.id

        async def event_stream():
            try:
                async for evt in execute_chat_turn_stream(
                    query,
                    kb_id,
                    tenant_id=tenant_id,
                    messages=body.get("messages"),
                    settings=settings,
                    pipeline_ids=body.get("pipeline_ids"),
                ):
                    yield format_sse(evt)
            except Exception as ex:
                logger.exception("rag3_query_stream failed")
                yield format_sse({"event": "error", "data": {"message": str(ex)}})

        resp = Response(event_stream(), mimetype="text/event-stream")
        resp.headers.add_header("Cache-Control", "no-cache")
        resp.headers.add_header("Connection", "keep-alive")
        resp.headers.add_header("X-Accel-Buffering", "no")
        return resp
    except Exception as e:
        return server_error_response(e)


@manager.route("/query/parse", methods=["POST"])  # noqa: F821
@login_required
@validate_request("query")
async def rag3_query_parse():
    """PRD §4.6 高级检索语法解析"""
    try:
        body = await request.json
        query = body.get("query", "")
        parsed = parse_advanced_query(query)
        return get_json_result(data=parsed)
    except Exception as e:
        logger.exception("rag3_query_parse failed")
        return server_error_response(e)


@manager.route("/query/rewrite", methods=["POST"])  # noqa: F821
@login_required
@validate_request("query")
async def rag3_query_rewrite():
    try:
        body = await request.json
        query = body.get("query", "")
        plan = _engine.plan(query, body.get("user_roles") or [], body.get("kb_id"))
        rewritten = query
        if plan.classification.query_tier in ("tier_3", "tier_4", "Tier 3", "Tier 4"):
            rewritten = f"{query}（{plan.classification.doc_type}相关）"
        return get_json_result(data={
            "original": query,
            "rewritten": rewritten,
            "classification": {
                "query_tier": plan.classification.query_tier,
                "doc_type": plan.classification.doc_type,
                "user_intent": plan.classification.user_intent,
            },
            "pipeline_ids": plan.pipeline_ids,
        })
    except Exception as e:
        return server_error_response(e)


@manager.route("/query/compare", methods=["POST"])  # noqa: F821
@login_required
@validate_request("query", "kb_id")
async def rag3_query_compare():
    try:
        body = await request.json
        query = body.get("query", "")
        kb_id = body.get("kb_id", "")
        import asyncio
        settings_a = {"strategy": body.get("strategy_a") or "precise"}
        settings_b = {"strategy": body.get("strategy_b") or "comprehensive"}
        a, b = await asyncio.gather(
            execute_chat_turn(query, kb_id, tenant_id=current_user.id, settings=settings_a),
            execute_chat_turn(query, kb_id, tenant_id=current_user.id, settings=settings_b),
        )
        return get_json_result(data={
            "query": query,
            "answer_a": a.get("content"),
            "answer_b": b.get("content"),
            "citations_a": a.get("citations"),
            "citations_b": b.get("citations"),
        })
    except Exception as e:
        return server_error_response(e)


@manager.route("/datasets/<dataset_id>/index", methods=["POST"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
async def rag3_run_dataset_index(tenant_id, dataset_id):
    """触发 RAG3 增强索引构建：pageindex | wiki"""
    index_type = (request.args.get("type", "") or "").lower()
    body = await request.get_json(silent=True) or {}
    doc_ids = body.get("doc_ids") if isinstance(body, dict) else None
    if doc_ids is not None and not isinstance(doc_ids, list):
        return get_error_data_result(message="doc_ids must be a list")
    success, result = rag3_run_index(dataset_id, tenant_id, index_type, doc_ids=doc_ids)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/index", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_trace_dataset_index(tenant_id, dataset_id):
    """查询 RAG3 增强索引任务进度（对齐 datasets index trace 字段）"""
    index_type = (request.args.get("type", "") or "").lower()
    success, result = rag3_trace_index(dataset_id, tenant_id, index_type)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/pageindex/documents", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_list_pageindex_documents(tenant_id, dataset_id):
    success, result = list_pageindex_documents(dataset_id, tenant_id)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/pageindex/documents/<doc_id>/tree", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_get_pageindex_tree(tenant_id, dataset_id, doc_id):
    success, result = get_pageindex_document_tree(dataset_id, doc_id, tenant_id)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/pageindex/settings", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_get_pageindex_settings(tenant_id, dataset_id):
    return get_json_result(data=get_pageindex_settings(dataset_id))


@manager.route("/datasets/<dataset_id>/pageindex/settings", methods=["PUT"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
async def rag3_save_pageindex_settings(tenant_id, dataset_id):
    body = await request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return get_error_data_result(message="settings must be an object")
    return get_json_result(data=save_pageindex_settings(dataset_id, body))


@manager.route("/datasets/<dataset_id>/pageindex/analytics", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_get_pageindex_analytics(tenant_id, dataset_id):
    success, result = get_pageindex_hub_analytics(dataset_id, tenant_id)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/pageindex/search", methods=["POST"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
async def rag3_pageindex_search(tenant_id, dataset_id):
    body = await request.get_json(silent=True) or {}
    query = body.get("query", "")
    top_k = int(body.get("top_k", 10))
    doc_id = body.get("doc_id") or None
    mode = body.get("mode") or None
    result = search_pageindex_library(
        dataset_id, query, top_k=top_k, doc_id=doc_id, mode=mode,
    )
    return get_json_result(data=result)


@manager.route("/datasets/<dataset_id>/wiki/settings", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_get_wiki_settings(tenant_id, dataset_id):
    return get_json_result(data=get_wiki_settings(dataset_id))


@manager.route("/datasets/<dataset_id>/wiki/settings", methods=["PUT"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
async def rag3_save_wiki_settings(tenant_id, dataset_id):
    body = await request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return get_error_data_result(message="settings must be an object")
    return get_json_result(data=save_wiki_settings(dataset_id, body))


@manager.route("/datasets/<dataset_id>/wiki/analytics", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_get_wiki_analytics(tenant_id, dataset_id):
    success, result = get_wiki_hub_analytics(dataset_id, tenant_id)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/wiki/entries", methods=["GET"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
def rag3_list_wiki_entries(tenant_id, dataset_id):
    success, result = list_wiki_hub_entries(dataset_id, tenant_id)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.route("/datasets/<dataset_id>/wiki/search", methods=["POST"])  # noqa: F821
@login_required
@add_tenant_id_to_kwargs
async def rag3_wiki_search(tenant_id, dataset_id):
    body = await request.get_json(silent=True) or {}
    query = body.get("query", "")
    top_k = int(body.get("top_k", 10))
    result = search_wiki_library(dataset_id, query, top_k=top_k)
    return get_json_result(data=result)

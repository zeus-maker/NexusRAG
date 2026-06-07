#
# RAG 3.0 API extension — 自动注册为 /v1/rag3/*
#
import logging
import time

from quart import request

from api.apps import login_required
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
from fusion import reciprocal_rank_fusion, rerank
from pipelines import run_pipelines
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
@validate_request("query")
async def rag3_query():
    """分类 → 多通道检索 → RRF 融合 → 精排（核心查询路径）"""
    try:
        body = await request.json
        query = body.get("query", "")
        kb_id = body.get("kb_id", "kb-001")
        roles = body.get("user_roles") or []
        use_rerank = body.get("use_rerank", True)
        top_k = int(body.get("top_k", 10))

        t0 = time.time()
        plan = _engine.plan(query, roles, kb_id)
        override_pipelines = body.get("pipeline_ids")
        if isinstance(override_pipelines, list) and override_pipelines:
            plan.pipeline_ids = [str(p) for p in override_pipelines]

        if plan.decision.skip_retrieval:
            return get_json_result(data={
                "query": query,
                "answer_mode": "direct",
                "plan": plan.decision.reason,
                "latency_ms": int((time.time() - t0) * 1000),
            })

        channel_results = run_pipelines(plan.pipeline_ids, query, kb_id, top_k=top_k)
        fused = reciprocal_rank_fusion(channel_results)
        if use_rerank:
            fused = rerank(query, fused, top_n=min(5, top_k))

        citations = []
        answer_parts = [f"根据知识库检索，与「{query}」相关的内容如下：", ""]
        for i, h in enumerate(fused[:5], start=1):
            page_raw = (h.metadata or {}).get("page", "")
            page_num = 0
            if isinstance(page_raw, (int, float)):
                page_num = int(page_raw)
            elif isinstance(page_raw, str):
                digits = "".join(ch for ch in page_raw if ch.isdigit())
                page_num = int(digits) if digits else 0
            answer_parts.append(f"**{i}. {h.doc_name}**")
            answer_parts.append(h.snippet)
            answer_parts.append("")
            citations.append({
                "index": i,
                "doc_id": h.doc_id,
                "doc_name": h.doc_name,
                "page_number": page_num,
                "section": (h.snippet or "")[:48],
                "snippet": (h.snippet or "")[:200],
                "relevance_score": h.wrrf_score,
            })
        answer = "\n".join(answer_parts).strip() if fused else "未在知识库中找到与问题相关的内容。"

        return get_json_result(data={
            "query": query,
            "kb_id": kb_id,
            "answer": answer,
            "citations": citations,
            "pipelines": [r.channel for r in channel_results],
            "channels": [r.channel for r in channel_results],
            "fusion": [
                {
                    "rank": h.rank,
                    "chunk_id": h.chunk_id,
                    "doc_id": h.doc_id,
                    "doc_name": h.doc_name,
                    "wrrf_score": h.wrrf_score,
                    "snippet": h.snippet,
                    "sources": h.sources,
                    "metadata": h.metadata or {},
                }
                for h in fused
            ],
            "classification": plan.classification.query_tier,
            "routing_reason": plan.decision.reason,
            "latency_ms": int((time.time() - t0) * 1000),
        })
    except Exception as e:
        logger.exception("rag3_query failed")
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

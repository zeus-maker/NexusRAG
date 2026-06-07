#
# RAG 3.0 API extension — 自动注册为 /v1/rag3/*
#
import logging
import time

from quart import request

from api.utils.api_utils import get_json_result, server_error_response, validate_request
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

        return get_json_result(data={
            "query": query,
            "kb_id": kb_id,
            "pipelines": [r.channel for r in channel_results],
            "fusion": [
                {
                    "rank": h.rank,
                    "chunk_id": h.chunk_id,
                    "doc_name": h.doc_name,
                    "wrrf_score": h.wrrf_score,
                    "snippet": h.snippet,
                    "sources": h.sources,
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

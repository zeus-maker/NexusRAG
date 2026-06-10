#
# RAG3 智能对话核心编排
#
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any, AsyncIterator

from api.db.services.knowledgebase_service import KnowledgebaseService
from common.misc_utils import thread_pool_exec
from fusion import reciprocal_rank_fusion, rerank
from pipelines import run_pipelines
from router import RouterEngine

from rag3.conversation_models import merge_settings
from rag3.filter_utils import apply_metadata_filters
from rag3.generation_service import generate_answer, generate_answer_stream, template_answer
from rag3.query_parser import parse_advanced_query
from security.chunk_acl import filter_fused_hits_by_acl

logger = logging.getLogger(__name__)
_engine = RouterEngine()

_STRATEGY_PIPELINES: dict[str, list[str]] = {
    "immediate": ["vector"],
    "precise": ["vector", "pageindex"],
    "comprehensive": ["vector", "pageindex", "wiki", "graph"],
}


def _settings_to_pipeline_ids(settings: dict[str, Any], plan_ids: list[str]) -> list[str]:
    if settings.get("pipeline_ids"):
        return [str(p) for p in settings["pipeline_ids"]]
    strategy = settings.get("strategy") or "auto"
    if strategy in _STRATEGY_PIPELINES:
        return _STRATEGY_PIPELINES[strategy]
    ids = list(plan_ids)
    if not settings.get("channel_wiki", True):
        ids = [p for p in ids if p != "wiki"]
    if not settings.get("channel_pageindex", True):
        ids = [p for p in ids if p != "pageindex"]
    if not settings.get("channel_graph", False):
        ids = [p for p in ids if p != "graph"]
    return ids or plan_ids


def _resolve_tenant_kb(kb_id: str, tenant_id: str | None = None) -> tuple[str | None, str | None]:
    ok, kb = KnowledgebaseService.get_by_id(kb_id)
    if not ok or not kb:
        return None, None
    tid = kb.tenant_id or tenant_id
    return tid, kb_id


def _build_trace(plan, channel_results, fused, reranked, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    trace = {
        "classification": {
            "query_tier": plan.classification.query_tier,
            "doc_type": plan.classification.doc_type,
            "user_intent": plan.classification.user_intent,
            "confidence": plan.classification.confidence,
        },
        "routing_reason": plan.decision.reason,
        "channels": [
            {
                "channel": r.channel,
                "hit_count": len(r.hits),
                "latency_ms": r.latency_ms,
            }
            for r in channel_results
        ],
        "fusion_count": len(fused),
        "rerank_count": len(reranked),
    }
    if extra:
        trace.update(extra)
    return trace


def _prepare_query(query: str, settings: dict[str, Any]) -> tuple[str, dict[str, Any] | None, dict[str, Any] | None]:
    metadata_filters = settings.get("metadata_filters")
    parsed = None
    if metadata_filters or ":" in query or re.search(r"\b(AND|OR|NOT)\b", query, flags=re.I):
        parsed = parse_advanced_query(query)
        if not metadata_filters and parsed.get("metadata_filters", {}).get("conditions"):
            metadata_filters = parsed["metadata_filters"]
    search_query = (parsed or {}).get("free_text") or query
    return search_query, metadata_filters, parsed


async def execute_chat_turn(
    query: str,
    kb_id: str,
    *,
    tenant_id: str | None = None,
    user_roles: list[str] | None = None,
    messages: list[dict[str, Any]] | None = None,
    settings: dict[str, Any] | None = None,
    pipeline_ids: list[str] | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    t0 = time.time()
    lat: dict[str, int] = {}
    settings = merge_settings(settings or {})
    tid, kb = _resolve_tenant_kb(kb_id, tenant_id)
    if not kb:
        return {"error": "知识库不存在", "code": 4001}

    search_query, metadata_filters, parsed = _prepare_query(query, settings)

    t_classify = time.time()
    plan = _engine.plan(search_query, user_roles or [], kb_id)
    lat["classify"] = int((time.time() - t_classify) * 1000)

    if isinstance(pipeline_ids, list) and pipeline_ids:
        plan.pipeline_ids = [str(p) for p in pipeline_ids]
    else:
        plan.pipeline_ids = _settings_to_pipeline_ids(settings, plan.pipeline_ids)

    if plan.decision.skip_retrieval:
        return {
            "query": query,
            "kb_id": kb_id,
            "answer_mode": "direct",
            "content": "您好，我是知识库助手。请提出与知识库相关的问题。",
            "plan": plan.decision.reason,
            "routing_tier": plan.classification.query_tier,
            "retrieval_channels": [],
            "citations": [],
            "latency_ms": int((time.time() - t0) * 1000),
        }

    top_k = int(settings.get("top_k") or 10)
    use_rerank = bool(settings.get("use_rerank", True))
    ctx = {
        "tenant_id": tid,
        "similarity_threshold": float(settings.get("similarity_threshold") or 0.2),
        "vector_weight": float(settings.get("vector_weight") or 0.7),
        "use_rerank": use_rerank,
        "metadata_filters": metadata_filters,
    }

    t_retrieve = time.time()
    channel_results = run_pipelines(plan.pipeline_ids, search_query, kb_id, top_k=top_k, **ctx)
    fused = reciprocal_rank_fusion(channel_results)
    fused = apply_metadata_filters(fused, metadata_filters)
    reranked = rerank(search_query, fused, top_n=min(5, top_k), tenant_id=tid, use_rerank=use_rerank)
    acl_before = len(reranked)
    reranked = filter_fused_hits_by_acl(reranked, user_roles)
    lat["retrieve"] = int((time.time() - t_retrieve) * 1000)
    lat["rerank"] = 0

    trace = _build_trace(plan, channel_results, fused, reranked, {
        "parsed_query": parsed,
        "metadata_filters": metadata_filters,
        "acl_filtered_count": acl_before - len(reranked),
    })

    t_gen = time.time()
    gen_result: dict[str, Any]
    if use_llm and tid:
        try:
            gen_result = await generate_answer(
                tid,
                search_query,
                reranked,
                messages=messages,
                system_prompt=settings.get("system_prompt") or "",
                llm_model=settings.get("llm_model") or "",
                temperature=float(settings.get("temperature") or 0.3),
                max_tokens=int(settings.get("max_tokens") or 2048),
            )
        except Exception:
            logger.exception("LLM generation failed, fallback to template")
            gen_result = template_answer(search_query, reranked)
    else:
        gen_result = template_answer(search_query, reranked)
    lat["generate"] = int((time.time() - t_gen) * 1000)

    channels = [r.channel for r in channel_results]
    total_ms = int((time.time() - t0) * 1000)
    lat["total"] = total_ms

    return {
        "query": query,
        "kb_id": kb_id,
        "content": gen_result.get("content") or "",
        "answer": gen_result.get("content") or "",
        "citations": gen_result.get("citations") or [],
        "routing_tier": plan.classification.query_tier,
        "retrieval_channels": channels,
        "pipelines": channels,
        "channels": channels,
        "classification": plan.classification.query_tier,
        "routing_reason": plan.decision.reason,
        "confidence": gen_result.get("confidence"),
        "token_usage": gen_result.get("token_usage"),
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
            for h in reranked
        ],
        "trace": trace,
        "latency_ms": lat,
    }


async def execute_chat_turn_stream(
    query: str,
    kb_id: str,
    *,
    tenant_id: str | None = None,
    user_roles: list[str] | None = None,
    messages: list[dict[str, Any]] | None = None,
    settings: dict[str, Any] | None = None,
    pipeline_ids: list[str] | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Yield SSE event dicts: {event, data}"""
    t0 = time.time()
    settings = merge_settings(settings or {})
    tid, kb = _resolve_tenant_kb(kb_id, tenant_id)
    if not kb:
        yield {"event": "error", "data": {"code": 4001, "message": "知识库不存在"}}
        return

    search_query, metadata_filters, parsed = _prepare_query(query, settings)

    plan = _engine.plan(search_query, user_roles or [], kb_id)
    if isinstance(pipeline_ids, list) and pipeline_ids:
        plan.pipeline_ids = [str(p) for p in pipeline_ids]
    else:
        plan.pipeline_ids = _settings_to_pipeline_ids(settings, plan.pipeline_ids)

    yield {
        "event": "routing",
        "data": {
            "tier": plan.classification.query_tier,
            "channels": plan.pipeline_ids,
            "model": settings.get("llm_model") or "",
            "parsed_query": parsed,
        },
    }
    await asyncio.sleep(0)

    if plan.decision.skip_retrieval:
        yield {"event": "token", "data": {"content": "您好，我是知识库助手。请提出与知识库相关的问题。", "index": 0}}
        yield {"event": "done", "data": {"total_tokens": 0, "latency_ms": int((time.time() - t0) * 1000)}}
        return

    top_k = int(settings.get("top_k") or 10)
    use_rerank = bool(settings.get("use_rerank", True))
    ctx = {
        "tenant_id": tid,
        "similarity_threshold": float(settings.get("similarity_threshold") or 0.2),
        "vector_weight": float(settings.get("vector_weight") or 0.7),
        "use_rerank": use_rerank,
        "metadata_filters": metadata_filters,
    }

    def _retrieve_and_rank():
        results = run_pipelines(plan.pipeline_ids, search_query, kb_id, top_k=top_k, **ctx)
        fused_hits = reciprocal_rank_fusion(results)
        fused_hits = apply_metadata_filters(fused_hits, metadata_filters)
        ranked = rerank(search_query, fused_hits, top_n=min(5, top_k), tenant_id=tid, use_rerank=use_rerank)
        return results, fused_hits, ranked

    channel_results, fused, reranked = await thread_pool_exec(_retrieve_and_rank)
    for r in channel_results:
        yield {
            "event": "searching",
            "data": {
                "channel": r.channel,
                "status": "completed",
                "results_count": len(r.hits),
                "latency_ms": r.latency_ms,
            },
        }
        await asyncio.sleep(0)

    acl_before = len(reranked)
    reranked = filter_fused_hits_by_acl(reranked, user_roles)
    trace = _build_trace(plan, channel_results, fused, reranked, {
        "parsed_query": parsed,
        "metadata_filters": metadata_filters,
        "acl_filtered_count": acl_before - len(reranked),
    })

    token_idx = 0
    total_tokens = 0
    if tid:
        try:
            async for kind, payload in generate_answer_stream(
                tid,
                search_query,
                reranked,
                messages=messages,
                system_prompt=settings.get("system_prompt") or "",
                llm_model=settings.get("llm_model") or "",
                temperature=float(settings.get("temperature") or 0.3),
                max_tokens=int(settings.get("max_tokens") or 2048),
            ):
                if kind == "citation":
                    yield {"event": "citation", "data": payload}
                elif kind == "token":
                    yield {"event": "token", "data": {"content": payload, "index": token_idx}}
                    token_idx += 1
                    await asyncio.sleep(0)
                elif kind == "usage":
                    total_tokens = payload.get("total_tokens") or 0
        except Exception as ex:
            logger.exception("stream generation failed")
            fallback = template_answer(search_query, reranked)
            yield {"event": "token", "data": {"content": fallback["content"], "index": 0}}
            for c in fallback.get("citations") or []:
                yield {"event": "citation", "data": c}
    else:
        fallback = template_answer(search_query, reranked)
        yield {"event": "token", "data": {"content": fallback["content"], "index": 0}}

    confidence = round(min(0.99, (reranked[0].wrrf_score if reranked else 0.5) * 1.05), 2)
    yield {"event": "confidence", "data": {"score": confidence, "level": "high" if confidence >= 0.8 else "medium"}}
    yield {
        "event": "done",
        "data": {
            "total_tokens": total_tokens,
            "latency_ms": int((time.time() - t0) * 1000),
            "trace": trace,
            "routing_tier": plan.classification.query_tier,
            "retrieval_channels": [r.channel for r in channel_results],
        },
    }


def format_sse(evt: dict[str, Any]) -> str:
    return f"event: {evt['event']}\ndata: {json.dumps(evt.get('data') or {}, ensure_ascii=False)}\n\n"

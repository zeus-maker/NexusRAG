#
# 链路追踪 — QueryLog 映射
#
from __future__ import annotations

import logging
from typing import Any

from api.db.db_models import QueryLog

logger = logging.getLogger(__name__)


def _log_to_trace_summary(lg: QueryLog) -> dict[str, Any]:
    channels = lg.retrieval_channels or []
    if isinstance(channels, str):
        channels = [channels]
    token_usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
    return {
        "id": lg.log_id,
        "traceId": lg.log_id,
        "conversationId": lg.conversation_id or "",
        "query": (lg.query_text or "")[:200],
        "status": "success" if lg.total_latency_ms else "unknown",
        "latencyMs": lg.total_latency_ms or 0,
        "timestamp": lg.created_at,
        "userId": lg.user_id,
        "kbId": lg.kb_id,
        "channels": channels,
        "routeTier": lg.complexity_tier or "",
        "retrievalLatencyMs": 0,
        "generationLatencyMs": 0,
    }


def list_traces(
    tenant_id: str,
    *,
    search: str = "",
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    items = []
    try:
        q = QueryLog.select().where(QueryLog.tenant_id == tenant_id).order_by(QueryLog.created_at.desc())
        rows = list(q.limit(1000))
        for lg in rows:
            summary = _log_to_trace_summary(lg)
            if search:
                s = search.lower()
                if s not in (summary.get("query") or "").lower() and s not in (summary.get("traceId") or "").lower():
                    continue
            items.append(summary)
    except Exception as e:
        logger.warning("list_traces failed: %s", e)

    total = len(items)
    start = (page - 1) * page_size
    page_items = items[start:start + page_size]
    return {"items": page_items, "total": total, "page": page, "page_size": page_size}


def get_trace_detail(tenant_id: str, trace_id: str) -> dict[str, Any] | None:
    try:
        lg = QueryLog.get_or_none((QueryLog.log_id == trace_id) & (QueryLog.tenant_id == tenant_id))
    except Exception as e:
        logger.warning("get_trace_detail failed: %s", e)
        return None
    if not lg:
        return None
    channels = lg.retrieval_channels or []
    if isinstance(channels, str):
        channels = [channels]
    spans = [
        {"name": "retrieval", "durationMs": 0, "status": "ok"},
        {"name": "generation", "durationMs": lg.total_latency_ms or 0, "status": "ok"},
    ]
    token_usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
    return {
        **_log_to_trace_summary(lg),
        "spans": spans,
        "retrievalChannels": channels,
        "tokenUsage": {
            "prompt": token_usage.get("prompt_tokens") or token_usage.get("prompt") or 0,
            "completion": token_usage.get("completion_tokens") or token_usage.get("completion") or 0,
            "total": token_usage.get("total_tokens") or token_usage.get("total") or 0,
        },
        "metadata": {
            "routeTier": lg.complexity_tier,
            "model": lg.llm_model_used,
        },
    }

#
# 链路追踪 — QueryLog + trace_json 映射为 UI TraceRecord
#
from __future__ import annotations

import logging
import statistics
import uuid
from typing import Any

from api.db.db_models import QueryLog
from rag3.cost_config import estimate_cost_cny

logger = logging.getLogger(__name__)

_MS_HOUR = 3600 * 1000


def _percentile(values: list[int], pct: float) -> int:
    if not values:
        return 0
    if len(values) == 1:
        return values[0]
    try:
        return int(statistics.quantiles(values, n=100)[max(0, min(98, int(pct) - 1))])
    except Exception:
        sorted_v = sorted(values)
        idx = int(len(sorted_v) * pct / 100)
        return sorted_v[min(idx, len(sorted_v) - 1)]


def _trace_payload(lg: QueryLog) -> dict[str, Any]:
    raw = getattr(lg, "trace_json", None)
    return raw if isinstance(raw, dict) else {}


def _token_total(lg: QueryLog) -> int:
    usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
    return int(usage.get("total_tokens") or usage.get("total") or 0)


def _estimate_cost(lg: QueryLog) -> float:
    usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
    return round(estimate_cost_cny(usage, lg.llm_model_used or ""), 4)


def _status_from_log(lg: QueryLog) -> str:
    if lg.user_feedback == "negative":
        return "error"
    if not (lg.response_text or "").strip():
        return "error"
    if lg.total_latency_ms and lg.total_latency_ms > 30000:
        return "timeout"
    return "success"


def _empty_retrieval(trace: dict[str, Any], lg: QueryLog) -> bool:
    if trace.get("rerank_count", 0) == 0 and trace.get("fusion_count", 0) == 0:
        return True
    channels = lg.retrieval_channels or []
    if isinstance(channels, list) and len(channels) == 0:
        return True
    ch_list = trace.get("channels") or []
    if isinstance(ch_list, list):
        return all(int(c.get("hit_count") or 0) == 0 for c in ch_list if isinstance(c, dict))
    return False


def _build_layers(trace: dict[str, Any], total_ms: int) -> list[dict[str, Any]]:
    clf = trace.get("classification") or {}
    lat = trace.get("latency_ms") if isinstance(trace.get("latency_ms"), dict) else {}
    channels = trace.get("channels") or []
    ch_detail = " │ ".join(
        f"{c.get('channel', '?')} {c.get('hit_count', 0)}条"
        for c in channels if isinstance(c, dict)
    ) or "—"
    retrieve_ms = int(lat.get("retrieve") or 0)
    generate_ms = int(lat.get("generate") or 0)
    fusion_ms = max(0, total_ms - retrieve_ms - generate_ms - 200) if total_ms else 0
    return [
        {
            "layer": "L1",
            "label": "四分类器",
            "detail": f"{clf.get('query_tier', '—')} / {clf.get('doc_type', '—')} / {clf.get('user_intent', '—')}",
            "ms": 120,
        },
        {
            "layer": "L2",
            "label": "路由决策",
            "detail": (trace.get("routing_reason") or "—")[:80],
            "ms": 45,
        },
        {
            "layer": "L3",
            "label": "多通道检索",
            "detail": ch_detail,
            "ms": retrieve_ms or int(total_ms * 0.45),
        },
        {
            "layer": "L4",
            "label": "RRF+精排",
            "detail": f"融合 {trace.get('fusion_count', 0)} → 精排 {trace.get('rerank_count', 0)}",
            "ms": fusion_ms or int(total_ms * 0.12),
        },
        {
            "layer": "L5",
            "label": "LLM 生成",
            "detail": lg_model_detail(trace, lg_hint=""),
            "ms": generate_ms or max(0, total_ms - retrieve_ms - fusion_ms),
        },
    ]


def lg_model_detail(trace: dict[str, Any], lg_hint: str = "") -> str:
    return lg_hint or "LLM"


def _mk_span(
    span_id: str,
    name: str,
    span_type: str,
    start_ms: int,
    duration_ms: int,
    *,
    status: str = "ok",
    children: list | None = None,
    input_data: dict | None = None,
    output_data: dict | None = None,
    attributes: dict | None = None,
    observation_kind: str | None = None,
) -> dict[str, Any]:
    sp: dict[str, Any] = {
        "id": span_id,
        "name": name,
        "type": span_type,
        "startMs": start_ms,
        "durationMs": max(duration_ms, 0),
        "status": status,
    }
    if children:
        sp["children"] = children
    if input_data:
        sp["input"] = input_data
    if output_data:
        sp["output"] = output_data
    if attributes:
        sp["attributes"] = attributes
    if observation_kind:
        sp["observationKind"] = observation_kind
    elif span_type == "llm":
        sp["observationKind"] = "generation"
    return sp


def _build_root_span(trace: dict[str, Any], lg: QueryLog) -> dict[str, Any]:
    total_ms = lg.total_latency_ms or 0
    lat = trace.get("latency_ms") if isinstance(trace.get("latency_ms"), dict) else {}
    retrieve_ms = int(lat.get("retrieve") or int(total_ms * 0.45))
    generate_ms = int(lat.get("generate") or max(0, total_ms - retrieve_ms - 200))
    fusion_ms = max(0, total_ms - retrieve_ms - generate_ms - 165)

    clf = trace.get("classification") or {}
    channels = trace.get("channels") or []
    retrieval_children = []
    cursor = 165
    for i, ch in enumerate(channels):
        if not isinstance(ch, dict):
            continue
        ch_ms = int(ch.get("latency_ms") or retrieve_ms // max(len(channels), 1))
        retrieval_children.append(_mk_span(
            f"sp-ret-{i}",
            f"retrieval.{ch.get('channel', 'channel')}",
            "retrieval",
            cursor,
            ch_ms,
            output_data={"chunks": ch.get("hit_count", 0), "error": ch.get("error")},
            attributes={"channel": ch.get("channel"), "top_k": ch.get("debug", {}).get("top_k") if isinstance(ch.get("debug"), dict) else None},
        ))
        cursor += max(ch_ms // 2, 10)

    children = [
        _mk_span(
            "sp-clf", "classifier", "classifier", 0, 120,
            input_data={"query": (lg.query_text or "")[:120], "kb_id": lg.kb_id},
            output_data=clf,
        ),
        _mk_span(
            "sp-router", "router", "router", 120, 45,
            output_data={"reason": trace.get("routing_reason"), "channels": lg.retrieval_channels},
        ),
        _mk_span(
            "sp-retrieval", "retrieval", "retrieval", 165, retrieve_ms,
            children=retrieval_children or None,
        ),
        _mk_span(
            "sp-fusion", "fusion.wrrf", "fusion", 165 + retrieve_ms, fusion_ms,
            output_data={"merged": trace.get("fusion_count", 0)},
            attributes={"rrf_k": 60},
        ),
        _mk_span(
            "sp-rerank", "rag.reranking", "rerank", 165 + retrieve_ms + fusion_ms, 180,
            attributes={
                "rag.reranking.input_count": trace.get("fusion_count", 0),
                "rag.reranking.output_count": trace.get("rerank_count", 0),
            },
            output_data={"top_n": trace.get("rerank_count", 0)},
        ),
        _mk_span(
            "sp-llm", "llm.generate", "llm", 165 + retrieve_ms + fusion_ms + 180, generate_ms,
            attributes={"model": lg.llm_model_used or "", "tokens": _token_total(lg)},
            output_data={"answer_preview": (lg.response_text or "")[:120]},
            observation_kind="generation",
        ),
    ]
    err = any(isinstance(c, dict) and c.get("error") for c in channels)
    return _mk_span(
        "sp-root",
        "root",
        "root",
        0,
        total_ms,
        status="error" if err or _status_from_log(lg) == "error" else "ok",
        children=children,
    )


def _quality_from_trace(trace: dict[str, Any], lg: QueryLog) -> dict[str, Any]:
    empty = _empty_retrieval(trace, lg)
    rerank_n = int(trace.get("rerank_count") or 0)
    fusion_n = int(trace.get("fusion_count") or 0)
    usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
    ctx_tokens = int(usage.get("prompt_tokens") or usage.get("prompt") or 0)
    return {
        "emptyRetrieval": empty,
        "contextTruncated": ctx_tokens > 8000,
        "retrievalResultsCount": fusion_n,
        "rerankInputCount": fusion_n,
        "rerankOutputCount": rerank_n,
        "topScore": None,
        "contextTokenCount": ctx_tokens,
    }


def _log_to_trace_record(lg: QueryLog, *, include_detail: bool = False) -> dict[str, Any]:
    trace = _trace_payload(lg)
    channels = lg.retrieval_channels or []
    if isinstance(channels, str):
        channels = [channels]
    pipeline = ", ".join(str(c) for c in channels) if channels else "—"
    status = _status_from_log(lg)
    tokens = _token_total(lg)
    cost = _estimate_cost(lg)
    total_ms = lg.total_latency_ms or 0
    layers = _build_layers(trace, total_ms)
    # fix L5 detail with model
    if layers and lg.llm_model_used:
        layers[-1]["detail"] = f"{lg.llm_model_used} │ {tokens} tokens"

    record: dict[str, Any] = {
        "id": lg.log_id,
        "traceId": lg.log_id,
        "conversationId": lg.conversation_id or "",
        "messageId": lg.message_id or "",
        "query": (lg.query_text or "")[:500],
        "user": lg.user_id,
        "userId": lg.user_id,
        "kb": lg.kb_id or "",
        "kbId": lg.kb_id or "",
        "durationMs": total_ms,
        "latencyMs": total_ms,
        "tokens": tokens,
        "cost": cost,
        "tier": lg.complexity_tier or (trace.get("classification") or {}).get("query_tier") or "",
        "routeTier": lg.complexity_tier or "",
        "pipeline": pipeline,
        "channels": channels,
        "status": status,
        "timestamp": lg.created_at,
        "time": lg.created_at,
        "environment": "production",
        "sessionId": lg.conversation_id or "",
        "convId": lg.conversation_id or "",
        "responsePreview": (lg.response_text or "")[:200],
        "userFeedback": lg.user_feedback,
        "llmModel": lg.llm_model_used or "",
    }
    if include_detail:
        record["layers"] = layers
        record["rootSpan"] = _build_root_span(trace, lg)
        record["quality"] = _quality_from_trace(trace, lg)
        record["retrievalChannels"] = channels
        usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
        record["tokenUsage"] = {
            "prompt": int(usage.get("prompt_tokens") or usage.get("prompt") or 0),
            "completion": int(usage.get("completion_tokens") or usage.get("completion") or 0),
            "total": tokens,
        }
        record["metadata"] = {
            "routeTier": lg.complexity_tier,
            "model": lg.llm_model_used,
            "routingReason": trace.get("routing_reason"),
        }
        record["trace"] = trace
    return record


def _log_to_trace_summary(lg: QueryLog) -> dict[str, Any]:
    r = _log_to_trace_record(lg, include_detail=False)
    return {
        "id": r["id"],
        "traceId": r["traceId"],
        "conversationId": r["conversationId"],
        "query": r["query"][:200],
        "status": r["status"],
        "latencyMs": r["latencyMs"],
        "timestamp": r["timestamp"],
        "userId": r["userId"],
        "kbId": r["kbId"],
        "channels": r["channels"],
        "routeTier": r["routeTier"],
        "tokens": r["tokens"],
        "cost": r["cost"],
        "pipeline": r["pipeline"],
    }


def list_traces(
    tenant_id: str,
    *,
    search: str = "",
    status: str = "",
    tier: str = "",
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    items = []
    try:
        q = QueryLog.select().where(QueryLog.tenant_id == tenant_id).order_by(QueryLog.created_at.desc())
        rows = list(q.limit(2000))
        for lg in rows:
            summary = _log_to_trace_summary(lg)
            if search:
                s = search.lower()
                if s not in (summary.get("query") or "").lower() and s not in (summary.get("traceId") or "").lower() and s not in (summary.get("userId") or "").lower():
                    continue
            if status and status != "all" and summary.get("status") != status:
                continue
            if tier and tier != "all" and summary.get("routeTier") != tier:
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
    return _log_to_trace_record(lg, include_detail=True)


def get_trace_stats(tenant_id: str, *, hours: int = 24) -> dict[str, Any]:
    since = int(__import__("time").time() * 1000) - hours * _MS_HOUR
    latencies: list[int] = []
    total = 0
    errors = 0
    empty = 0
    truncated = 0
    total_cost = 0.0
    total_tokens = 0
    try:
        rows = list(
            QueryLog.select()
            .where((QueryLog.tenant_id == tenant_id) & (QueryLog.created_at >= since))
        )
        for lg in rows:
            total += 1
            if lg.total_latency_ms:
                latencies.append(int(lg.total_latency_ms))
            if _status_from_log(lg) == "error":
                errors += 1
            trace = _trace_payload(lg)
            if _empty_retrieval(trace, lg):
                empty += 1
            usage = lg.token_usage if isinstance(lg.token_usage, dict) else {}
            pt = int(usage.get("prompt_tokens") or usage.get("prompt") or 0)
            if pt > 8000:
                truncated += 1
            total_cost += _estimate_cost(lg)
            total_tokens += _token_total(lg)
    except Exception as e:
        logger.warning("get_trace_stats failed: %s", e)

    p95 = _percentile(latencies, 95)
    return {
        "todayCount": total,
        "p95Ms": p95,
        "errorRate": round(errors / total * 100, 2) if total else 0,
        "avgTokens": int(total_tokens / total) if total else 0,
        "totalCostToday": round(total_cost, 2),
        "emptyRetrievalRate": round(empty / total * 100, 2) if total else 0,
        "contextTruncateRate": round(truncated / total * 100, 2) if total else 0,
        "hours": hours,
    }


def list_trace_sessions(tenant_id: str, *, search: str = "", limit: int = 100) -> list[dict[str, Any]]:
    sessions: dict[str, dict[str, Any]] = {}
    try:
        rows = list(
            QueryLog.select()
            .where(QueryLog.tenant_id == tenant_id)
            .order_by(QueryLog.created_at.desc())
            .limit(2000)
        )
        for lg in rows:
            sid = lg.conversation_id or f"orphan-{lg.log_id}"
            if sid not in sessions:
                sessions[sid] = {
                    "sessionId": sid,
                    "user": lg.user_id,
                    "title": (lg.query_text or "")[:40],
                    "turns": 0,
                    "totalTokens": 0,
                    "totalCost": 0.0,
                    "lastActive": lg.created_at,
                    "traceIds": [],
                }
            sess = sessions[sid]
            sess["turns"] += 1
            sess["totalTokens"] += _token_total(lg)
            sess["totalCost"] += _estimate_cost(lg)
            sess["traceIds"].append(lg.log_id)
            if lg.created_at and lg.created_at > (sess.get("lastActive") or 0):
                sess["lastActive"] = lg.created_at
                sess["title"] = (lg.query_text or sess["title"])[:40]
    except Exception as e:
        logger.warning("list_trace_sessions failed: %s", e)

    out = list(sessions.values())
    if search:
        s = search.lower()
        out = [x for x in out if s in (x.get("title") or "").lower() or s in (x.get("user") or "").lower() or s in (x.get("sessionId") or "").lower()]
    out.sort(key=lambda x: x.get("lastActive") or 0, reverse=True)
    for item in out:
        item["totalCost"] = round(item["totalCost"], 4)
    return out[:limit]


def export_trace_otlp(tenant_id: str, trace_id: str) -> dict[str, Any] | None:
    detail = get_trace_detail(tenant_id, trace_id)
    if not detail:
        return None
    trace_uuid = str(uuid.uuid5(uuid.NAMESPACE_URL, trace_id))
    return {
        "resourceSpans": [{
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "rag3"}}]},
            "scopeSpans": [{
                "scope": {"name": "rag3.trace"},
                "spans": [_span_to_otlp(detail["rootSpan"], trace_uuid)],
            }],
        }],
        "traceId": trace_id,
        "exportedAt": int(__import__("time").time() * 1000),
    }


def _span_to_otlp(span: dict[str, Any], trace_id: str, parent_id: str | None = None) -> dict[str, Any]:
    otlp = {
        "traceId": trace_id,
        "spanId": span.get("id", "root"),
        "parentSpanId": parent_id,
        "name": span.get("name"),
        "kind": 1,
        "startTimeUnixNano": int(span.get("startMs", 0)) * 1_000_000,
        "endTimeUnixNano": int((span.get("startMs", 0) + span.get("durationMs", 0))) * 1_000_000,
        "status": {"code": 1 if span.get("status") == "ok" else 2},
        "attributes": [{"key": "span.type", "value": {"stringValue": span.get("type", "")}}],
    }
    children = span.get("children") or []
    if children:
        otlp["children"] = [_span_to_otlp(c, trace_id, span.get("id")) for c in children]
    return otlp

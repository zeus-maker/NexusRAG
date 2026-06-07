#
# LLM Wiki Hub：编译设置持久化、检索/编译统计
#
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

from rag.utils.redis_conn import REDIS_CONN

logger = logging.getLogger(__name__)

_SETTINGS_TTL = 365 * 24 * 3600
_METRICS_TTL = 90 * 24 * 3600

_DEFAULT_SETTINGS: dict[str, Any] = {
    "trigger_mode": "manual",
    "llm_model": "deepseek-v4",
    "entity_threshold": 0.75,
    "manual_review": True,
    "auto_publish": False,
    "git_branch": "main",
    "auto_commit": True,
    "incremental_entity": True,
    "incremental_synthesis": True,
    "cite_review_threshold": 0.8,
}


def _settings_key(kb_id: str) -> str:
    return f"rag3:wiki:settings:{kb_id}"


def _metrics_key(kb_id: str) -> str:
    return f"rag3:wiki:metrics:{kb_id}"


def _decode(raw) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, bytes):
        return raw.decode("utf-8")
    return str(raw)


def get_wiki_settings(kb_id: str) -> dict[str, Any]:
    raw = REDIS_CONN.get(_settings_key(kb_id))
    if not raw:
        return dict(_DEFAULT_SETTINGS)
    try:
        data = json.loads(_decode(raw) or "{}")
        merged = dict(_DEFAULT_SETTINGS)
        if isinstance(data, dict):
            merged.update(data)
        return merged
    except json.JSONDecodeError:
        return dict(_DEFAULT_SETTINGS)


def save_wiki_settings(kb_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    current = get_wiki_settings(kb_id)
    if isinstance(patch, dict):
        for key, val in patch.items():
            snake = key.replace("-", "_")
            if snake in _DEFAULT_SETTINGS or key in _DEFAULT_SETTINGS:
                current[snake] = val
    REDIS_CONN.set(_settings_key(kb_id), json.dumps(current, ensure_ascii=False), _SETTINGS_TTL)
    return current


def _load_metrics(kb_id: str) -> dict[str, Any]:
    raw = REDIS_CONN.get(_metrics_key(kb_id))
    if not raw:
        return {
            "search_count": 0,
            "search_latencies": [],
            "entry_search_counts": {},
            "weekly_searches": [0] * 7,
            "weekly_builds": [0] * 7,
            "fail_reasons": {},
        }
    try:
        data = json.loads(_decode(raw) or "{}")
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _save_metrics(kb_id: str, data: dict[str, Any]) -> None:
    REDIS_CONN.set(_metrics_key(kb_id), json.dumps(data, ensure_ascii=False), _METRICS_TTL)


def _weekday_index() -> int:
    return datetime.now().weekday()


def record_wiki_search(
    kb_id: str,
    *,
    latency_ms: int,
    entry_id: str | None = None,
) -> None:
    data = _load_metrics(kb_id)
    data["search_count"] = int(data.get("search_count", 0)) + 1
    latencies = list(data.get("search_latencies") or [])
    latencies.append(int(latency_ms))
    data["search_latencies"] = latencies[-200:]
    weekly = list(data.get("weekly_searches") or [0] * 7)
    if len(weekly) < 7:
        weekly = (weekly + [0] * 7)[:7]
    weekly[_weekday_index()] = int(weekly[_weekday_index()]) + 1
    data["weekly_searches"] = weekly
    if entry_id:
        counts = dict(data.get("entry_search_counts") or {})
        counts[entry_id] = int(counts.get(entry_id, 0)) + 1
        data["entry_search_counts"] = counts
    _save_metrics(kb_id, data)


def record_wiki_build(kb_id: str, *, success: bool, fail_reason: str | None = None) -> None:
    data = _load_metrics(kb_id)
    weekly = list(data.get("weekly_builds") or [0] * 7)
    if len(weekly) < 7:
        weekly = (weekly + [0] * 7)[:7]
    if success:
        weekly[_weekday_index()] = int(weekly[_weekday_index()]) + 1
    data["weekly_builds"] = weekly
    if fail_reason:
        reasons = dict(data.get("fail_reasons") or {})
        reasons[fail_reason] = int(reasons.get(fail_reason, 0)) + 1
        data["fail_reasons"] = reasons
    _save_metrics(kb_id, data)


def _percentile(values: list[int], pct: float) -> int:
    if not values:
        return 0
    sorted_vals = sorted(values)
    idx = min(len(sorted_vals) - 1, max(0, int(len(sorted_vals) * pct) - 1))
    return int(sorted_vals[idx])


def get_wiki_analytics(
    kb_id: str,
    entries: list[dict[str, Any]],
    source_docs: list[dict[str, Any]],
) -> dict[str, Any]:
    metrics = _load_metrics(kb_id)
    latencies = [int(x) for x in (metrics.get("search_latencies") or []) if isinstance(x, (int, float))]
    entry_counts = metrics.get("entry_search_counts") or {}

    layer_buckets = {
        "raw/ 原始": 0,
        "entity 实体": 0,
        "concept 概念": 0,
        "synthesis 综合": 0,
    }
    for entry in entries:
        title = (entry.get("title") or "").lower()
        if "摘要" in title or "摘录" in title:
            layer_buckets["raw/ 原始"] += 1
        elif any(k in title for k in ("体系", "概念", "定义")):
            layer_buckets["concept 概念"] += 1
        elif any(k in title for k in ("汇总", "流程", "政策", "综合")):
            layer_buckets["synthesis 综合"] += 1
        else:
            layer_buckets["entity 实体"] += 1

    total_entries = len(entries) or 1
    layer_dist = [
        {"layer": k, "count": v, "pct": round(v / total_entries * 100, 1)}
        for k, v in layer_buckets.items()
        if v > 0
    ]

    top_cited = []
    for entry in entries:
        eid = entry.get("id") or ""
        searches = int(entry_counts.get(eid, 0))
        top_cited.append({
            "title": entry.get("title") or eid,
            "cites": searches,
            "entry_id": eid,
        })
    top_cited.sort(key=lambda x: x["cites"], reverse=True)

    kb_dist = [{"kb_id": kb_id, "name": kb_id, "count": len(entries)}]

    return {
        "search_latency_p50": _percentile(latencies, 0.5),
        "search_latency_p95": _percentile(latencies, 0.95),
        "search_count": int(metrics.get("search_count", 0)),
        "weekly_searches": list(metrics.get("weekly_searches") or [0] * 7),
        "weekly_compile": list(metrics.get("weekly_builds") or [0] * 7),
        "layer_dist": layer_dist,
        "top_cited": top_cited[:8],
        "kb_dist": kb_dist,
        "fail_dist": [
            {"reason": k, "count": v}
            for k, v in sorted((metrics.get("fail_reasons") or {}).items(), key=lambda x: -x[1])
        ][:6],
        "compiled_docs": sum(1 for d in source_docs if d.get("ingest_status") == "compiled"),
        "pending_docs": sum(1 for d in source_docs if d.get("ingest_status") == "pending"),
        "compiling_docs": sum(1 for d in source_docs if d.get("ingest_status") == "compiling"),
        "failed_docs": sum(1 for d in source_docs if d.get("ingest_status") == "failed"),
    }

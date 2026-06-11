#
# Satisfaction aggregation from query_logs
#
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from api.db.db_models import QueryLog
from common.time_utils import current_timestamp


def _day_key(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def _period_ms(period: str) -> int:
    mapping = {"7d": 7, "30d": 30, "90d": 90}
    days = mapping.get(period, 30)
    return days * 24 * 3600 * 1000


def get_summary(tenant_id: str, *, period: str = "30d", kb_id: str | None = None) -> dict[str, Any]:
    since = current_timestamp() - _period_ms(period)
    q = QueryLog.select().where(
        (QueryLog.tenant_id == tenant_id) & (QueryLog.created_at >= since)
    )
    if kb_id:
        q = q.where(QueryLog.kb_id == kb_id)

    total = positive = negative = 0
    for row in q:
        total += 1
        fb = (row.user_feedback or "none").lower()
        if fb == "positive":
            positive += 1
        elif fb == "negative":
            negative += 1

    rated = positive + negative
    positive_rate = round(positive / rated, 4) if rated else 0.0
    negative_rate = round(negative / rated, 4) if rated else 0.0
    nps = round((positive - negative) / rated * 100, 1) if rated else 0.0

    return {
        "positive_rate": positive_rate,
        "negative_rate": negative_rate,
        "correction_rate": 0.0,
        "nps": nps,
        "total_queries": total,
        "rated_count": rated,
    }


def get_trend(tenant_id: str, *, period: str = "30d", kb_id: str | None = None) -> list[dict[str, Any]]:
    since = current_timestamp() - _period_ms(period)
    q = QueryLog.select().where(
        (QueryLog.tenant_id == tenant_id) & (QueryLog.created_at >= since)
    )
    if kb_id:
        q = q.where(QueryLog.kb_id == kb_id)

    buckets: dict[str, dict[str, int]] = {}
    for row in q:
        day = _day_key(int(row.created_at)) if row.created_at else "unknown"
        if day not in buckets:
            buckets[day] = {"positive": 0, "negative": 0, "total": 0}
        buckets[day]["total"] += 1
        fb = (row.user_feedback or "none").lower()
        if fb == "positive":
            buckets[day]["positive"] += 1
        elif fb == "negative":
            buckets[day]["negative"] += 1

    points = []
    for day, stats in sorted(buckets.items()):
        rated = stats["positive"] + stats["negative"]
        points.append({
            "date": day,
            "positive_rate": round(stats["positive"] / rated, 4) if rated else 0,
            "negative_rate": round(stats["negative"] / rated, 4) if rated else 0,
            "nps": round((stats["positive"] - stats["negative"]) / rated * 100, 1) if rated else 0,
            "query_count": stats["total"],
        })
    return points


def get_negative_cases(
    tenant_id: str,
    *,
    period: str = "30d",
    kb_id: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    since = current_timestamp() - _period_ms(period)
    q = (
        QueryLog.select()
        .where(
            (QueryLog.tenant_id == tenant_id)
            & (QueryLog.created_at >= since)
            & (QueryLog.user_feedback == "negative")
        )
        .order_by(QueryLog.created_at.desc())
        .limit(limit)
    )
    if kb_id:
        q = q.where(QueryLog.kb_id == kb_id)

    cases = []
    for row in q:
        cases.append({
            "conv_id": row.conversation_id,
            "title": (row.query_text or "")[:48],
            "reason": "用户点踩",
            "rating": "negative",
            "query": row.query_text,
            "answer": row.response_text,
            "feedback": row.user_feedback,
            "kb_id": row.kb_id,
            "message_id": row.message_id,
            "created_at": row.created_at,
        })
    return cases

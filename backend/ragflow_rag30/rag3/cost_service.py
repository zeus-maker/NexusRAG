#
# Cost aggregation from query_logs
#
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from api.db.db_models import EvalCostBudget, QueryLog
from common.time_utils import current_timestamp
from rag3.cost_config import estimate_cost_cny


def _period_ms(period: str) -> int:
    mapping = {"7d": 7, "30d": 30, "90d": 90}
    return mapping.get(period, 30) * 24 * 3600 * 1000


def _iter_logs(tenant_id: str, period: str, kb_id: str | None = None):
    since = current_timestamp() - _period_ms(period)
    q = QueryLog.select().where(
        (QueryLog.tenant_id == tenant_id) & (QueryLog.created_at >= since)
    )
    if kb_id:
        q = q.where(QueryLog.kb_id == kb_id)
    return q


def get_summary(tenant_id: str, *, period: str = "30d", kb_id: str | None = None) -> dict[str, Any]:
    total_tokens = 0
    total_cost = 0.0
    for row in _iter_logs(tenant_id, period, kb_id):
        usage = row.token_usage or {}
        total_tokens += int(usage.get("total_tokens") or 0)
        total_cost += estimate_cost_cny(usage, row.llm_model_used or "")

    budget = get_budget(tenant_id)
    return {
        "total_cost_cny": round(total_cost, 2),
        "total_tokens": total_tokens,
        "period": period,
        "budget": budget,
        "budget_used_pct": round(total_cost / budget["monthly_budget"], 4) if budget["monthly_budget"] else 0,
    }


def get_breakdown(
    tenant_id: str,
    *,
    period: str = "30d",
    dimension: str = "kb",
) -> list[dict[str, Any]]:
    agg: dict[str, dict[str, Any]] = {}
    for row in _iter_logs(tenant_id, period):
        usage = row.token_usage or {}
        tokens = int(usage.get("total_tokens") or 0)
        cost = estimate_cost_cny(usage, row.llm_model_used or "")

        if dimension == "user":
            key = row.user_id or "unknown"
            label = key
        elif dimension == "model":
            key = row.llm_model_used or "unknown"
            label = key
        else:
            key = row.kb_id or "unknown"
            label = key

        if key not in agg:
            agg[key] = {"id": key, "name": label, "tokens": 0, "cost_cny": 0.0}
        agg[key]["tokens"] += tokens
        agg[key]["cost_cny"] += cost

    items = sorted(agg.values(), key=lambda x: x["cost_cny"], reverse=True)
    for item in items:
        item["cost_cny"] = round(item["cost_cny"], 2)
    return items


def get_trend(tenant_id: str, *, period: str = "30d") -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, float]] = {}
    for row in _iter_logs(tenant_id, period):
        day = datetime.fromtimestamp(int(row.created_at) / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        if day not in buckets:
            buckets[day] = {"tokens": 0, "cost_cny": 0.0}
        usage = row.token_usage or {}
        buckets[day]["tokens"] += int(usage.get("total_tokens") or 0)
        buckets[day]["cost_cny"] += estimate_cost_cny(usage, row.llm_model_used or "")

    return [
        {"date": d, "tokens": int(v["tokens"]), "cost_cny": round(v["cost_cny"], 2)}
        for d, v in sorted(buckets.items())
    ]


def get_budget(tenant_id: str) -> dict[str, Any]:
    try:
        row = EvalCostBudget.get_by_id(tenant_id)
        if row:
            return {
                "monthly_budget": float(row.monthly_budget),
                "alert_threshold": float(row.alert_threshold),
            }
    except Exception:
        pass
    return {"monthly_budget": 1000.0, "alert_threshold": 0.8}


def save_budget(tenant_id: str, monthly_budget: float, alert_threshold: float) -> dict[str, Any]:
    now = current_timestamp()
    try:
        row = EvalCostBudget.get_by_id(tenant_id)
        if row:
            EvalCostBudget.update(
                monthly_budget=monthly_budget,
                alert_threshold=alert_threshold,
                update_time=now,
            ).where(EvalCostBudget.tenant_id == tenant_id).execute()
        else:
            EvalCostBudget.create(
                tenant_id=tenant_id,
                monthly_budget=monthly_budget,
                alert_threshold=alert_threshold,
                update_time=now,
            )
    except Exception:
        EvalCostBudget.replace(
            tenant_id=tenant_id,
            monthly_budget=monthly_budget,
            alert_threshold=alert_threshold,
            update_time=now,
        ).execute()
    return get_budget(tenant_id)

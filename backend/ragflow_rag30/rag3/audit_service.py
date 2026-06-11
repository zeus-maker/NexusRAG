#
# 轻量审计事件
#
from __future__ import annotations

import logging
from typing import Any

from api.db.db_models import AuditEvent, QueryLog
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp

logger = logging.getLogger(__name__)


def log_audit_event(
    *,
    tenant_id: str,
    user_id: str,
    event_type: str,
    resource_type: str = "",
    resource_id: str = "",
    user_name: str = "",
    details: dict[str, Any] | None = None,
    ip_address: str = "",
) -> None:
    try:
        AuditEvent.create(
            id=get_uuid(),
            tenant_id=tenant_id,
            user_id=user_id,
            user_name=user_name or user_id,
            event_type=event_type,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            create_time=current_timestamp(),
        )
    except Exception as e:
        logger.warning("log_audit_event failed: %s", e)


def list_audit_logs(
    tenant_id: str,
    *,
    search: str = "",
    event_type: str = "",
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    items = []
    try:
        q = AuditEvent.select().where(AuditEvent.tenant_id == tenant_id).order_by(AuditEvent.create_time.desc())
        if event_type:
            q = q.where(AuditEvent.event_type == event_type)
        rows = list(q.limit(500))
        for r in rows:
            items.append({
                "event_id": r.id,
                "timestamp": r.create_time,
                "event_type": r.event_type,
                "user_id": r.user_id,
                "user_name": r.user_name,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "action": r.event_type,
                "resource": r.resource_id or r.resource_type,
                "details": r.details or {},
                "ip_address": r.ip_address,
            })
    except Exception as e:
        logger.warning("audit table query failed: %s", e)

    # 补充 QueryLog 作为 query 类审计
    try:
        logs = (
            QueryLog.select()
            .where(QueryLog.tenant_id == tenant_id)
            .order_by(QueryLog.created_at.desc())
            .limit(200)
        )
        for lg in logs:
            items.append({
                "event_id": lg.log_id,
                "timestamp": lg.created_at,
                "event_type": "query",
                "user_id": lg.user_id,
                "user_name": lg.user_id,
                "resource_type": "conversation",
                "resource_id": lg.conversation_id or "",
                "action": "query",
                "resource": (lg.query_text or "")[:80],
                "details": {
                    "kb_id": lg.kb_id,
                    "latency_ms": lg.total_latency_ms,
                    "channels": lg.retrieval_channels,
                },
                "ip_address": "",
            })
    except Exception as e:
        logger.warning("query_log audit merge failed: %s", e)

    if search:
        s = search.lower()
        items = [x for x in items if s in str(x.get("resource", "")).lower()
                 or s in str(x.get("user_name", "")).lower()
                 or s in str(x.get("action", "")).lower()]

    items.sort(key=lambda x: x.get("timestamp") or 0, reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    page_items = items[start:start + page_size]
    return {"items": page_items, "total": total, "page": page, "page_size": page_size}

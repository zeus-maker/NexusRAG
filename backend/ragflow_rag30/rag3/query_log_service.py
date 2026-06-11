#
# Query log persistence for satisfaction / cost / replay
#
from __future__ import annotations

import hashlib
import logging
from typing import Any

from api.db.db_models import QueryLog
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp

logger = logging.getLogger(__name__)


def _feedback_map(status: str) -> str:
    s = (status or "none").lower()
    if s in ("positive", "thumb_up", "up", "like"):
        return "positive"
    if s in ("negative", "thumb_down", "down", "dislike"):
        return "negative"
    return "none"


def append_log(
    *,
    tenant_id: str,
    user_id: str,
    kb_id: str | None,
    conversation_id: str | None,
    message_id: str | None,
    query_text: str,
    response_text: str | None = None,
    retrieval_channels: list[str] | None = None,
    token_usage: dict[str, Any] | None = None,
    total_latency_ms: int = 0,
    complexity_tier: str | None = None,
    llm_model_used: str | None = None,
    user_feedback: str = "none",
) -> dict[str, Any] | None:
    try:
        log_id = f"log_{get_uuid()}"
        now = current_timestamp()
        record = {
            "log_id": log_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "kb_id": kb_id,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "query_text": query_text,
            "response_text": response_text,
            "retrieval_channels": retrieval_channels or [],
            "token_usage": token_usage,
            "total_latency_ms": total_latency_ms,
            "complexity_tier": complexity_tier,
            "llm_model_used": llm_model_used,
            "user_feedback": _feedback_map(user_feedback),
            "created_at": now,
        }
        QueryLog.create(**record)
        return record
    except Exception as e:
        logger.warning("append_log failed: %s", e)
        return None


def update_feedback(
    *,
    tenant_id: str,
    conversation_id: str,
    message_id: str,
    feedback_type: str,
) -> bool:
    try:
        fb = _feedback_map(feedback_type)
        updated = (
            QueryLog.update(user_feedback=fb)
            .where(
                (QueryLog.tenant_id == tenant_id)
                & (QueryLog.conversation_id == conversation_id)
                & (QueryLog.message_id == message_id)
            )
            .execute()
        )
        return updated > 0
    except Exception as e:
        logger.warning("update_feedback failed: %s", e)
        return False


def query_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()[:32]

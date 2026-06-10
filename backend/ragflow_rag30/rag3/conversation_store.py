#
# RAG3 智能对话 — Redis 持久化（会话/消息/设置/反馈）
#
from __future__ import annotations

import json
import logging
import time
from typing import Any

from common.misc_utils import get_uuid
from rag.utils.redis_conn import REDIS_CONN

from rag3.conversation_models import DEFAULT_CONVERSATION_SETTINGS, merge_settings

logger = logging.getLogger(__name__)

_TTL = 365 * 24 * 3600


def _decode(raw) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, bytes):
        return raw.decode("utf-8")
    return str(raw)


def _conv_key(conv_id: str) -> str:
    return f"rag3:conv:{conv_id}"


def _msg_key(conv_id: str) -> str:
    return f"rag3:conv:{conv_id}:messages"


def _list_key(tenant_id: str, user_id: str) -> str:
    return f"rag3:conv:list:{tenant_id}:{user_id}"


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def create_conversation(
    tenant_id: str,
    user_id: str,
    kb_ids: list[str],
    *,
    title: str = "新对话",
    strategy: str = "auto",
    model: str = "",
    settings: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    conv_id = f"conv_{get_uuid()}"
    now = _now_iso()
    merged = merge_settings(settings)
    if model:
        merged["llm_model"] = model
    merged["strategy"] = strategy or merged.get("strategy", "auto")

    conv = {
        "conversation_id": conv_id,
        "tenant_id": tenant_id,
        "user_id": user_id,
        "kb_ids": kb_ids or [],
        "title": title or "新对话",
        "model": model or merged.get("llm_model", ""),
        "strategy": strategy or "auto",
        "status": "active",
        "message_count": 0,
        "pinned": False,
        "settings": merged,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }
    REDIS_CONN.set(_conv_key(conv_id), json.dumps(conv, ensure_ascii=False), _TTL)
    REDIS_CONN.zadd(_list_key(tenant_id, user_id), {conv_id: int(time.time() * 1000)})
    return conv


def list_conversations(tenant_id: str, user_id: str, *, search: str = "") -> list[dict[str, Any]]:
    raw_ids = REDIS_CONN.zrevrange(_list_key(tenant_id, user_id), 0, -1)
    convs: list[dict[str, Any]] = []
    for raw_id in raw_ids or []:
        cid = _decode(raw_id)
        if not cid:
            continue
        conv = get_conversation(cid)
        if not conv or conv.get("tenant_id") != tenant_id:
            continue
        if search and search not in (conv.get("title") or ""):
            continue
        convs.append(conv)
    return convs


def get_conversation(conv_id: str) -> dict[str, Any] | None:
    raw = REDIS_CONN.get(_conv_key(conv_id))
    if not raw:
        return None
    try:
        return json.loads(_decode(raw) or "{}")
    except json.JSONDecodeError:
        return None


def update_conversation(conv_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    conv = get_conversation(conv_id)
    if not conv:
        return None
    for key in ("title", "pinned", "status", "kb_ids", "model", "strategy", "metadata"):
        if key in patch:
            conv[key] = patch[key]
    conv["updated_at"] = _now_iso()
    REDIS_CONN.set(_conv_key(conv_id), json.dumps(conv, ensure_ascii=False), _TTL)
    return conv


def delete_conversation(conv_id: str) -> bool:
    conv = get_conversation(conv_id)
    if not conv:
        return False
    REDIS_CONN.delete(_conv_key(conv_id))
    REDIS_CONN.delete(_msg_key(conv_id))
    REDIS_CONN.zrem(_list_key(conv["tenant_id"], conv["user_id"]), conv_id)
    return True


def get_settings(conv_id: str) -> dict[str, Any]:
    conv = get_conversation(conv_id)
    if not conv:
        return dict(DEFAULT_CONVERSATION_SETTINGS)
    return merge_settings(conv.get("settings"))


def save_settings(conv_id: str, settings: dict[str, Any]) -> dict[str, Any]:
    conv = get_conversation(conv_id)
    if not conv:
        return dict(DEFAULT_CONVERSATION_SETTINGS)
    merged = merge_settings({**conv.get("settings", {}), **(settings or {})})
    conv["settings"] = merged
    if settings.get("llm_model"):
        conv["model"] = settings["llm_model"]
    conv["updated_at"] = _now_iso()
    REDIS_CONN.set(_conv_key(conv_id), json.dumps(conv, ensure_ascii=False), _TTL)
    return merged


def list_messages(conv_id: str, *, limit: int = 50, before_id: str | None = None) -> list[dict[str, Any]]:
    raw = REDIS_CONN.lrange(_msg_key(conv_id), 0, -1)
    messages: list[dict[str, Any]] = []
    for item in raw or []:
        try:
            messages.append(json.loads(_decode(item) or "{}"))
        except json.JSONDecodeError:
            continue
    if before_id:
        idx = next((i for i, m in enumerate(messages) if m.get("message_id") == before_id), -1)
        if idx > 0:
            messages = messages[:idx]
    return messages[-limit:]


def append_message(conv_id: str, message: dict[str, Any]) -> dict[str, Any]:
    msg_id = message.get("message_id") or f"msg_{get_uuid()}"
    now = _now_iso()
    record = {
        "message_id": msg_id,
        "conversation_id": conv_id,
        "role": message.get("role", "user"),
        "content": message.get("content", ""),
        "citations": message.get("citations") or [],
        "routing_tier": message.get("routing_tier"),
        "retrieval_channels": message.get("retrieval_channels") or [],
        "confidence": message.get("confidence"),
        "token_usage": message.get("token_usage"),
        "latency_ms": message.get("latency_ms"),
        "trace": message.get("trace"),
        "feedback_status": message.get("feedback_status", "none"),
        "metadata": message.get("metadata") or {},
        "created_at": now,
    }
    REDIS_CONN.rpush(_msg_key(conv_id), json.dumps(record, ensure_ascii=False))
    REDIS_CONN.expire(_msg_key(conv_id), _TTL)

    conv = get_conversation(conv_id)
    if conv:
        conv["message_count"] = int(conv.get("message_count") or 0) + 1
        conv["updated_at"] = now
        if record["role"] == "user" and conv.get("title") == "新对话":
            conv["title"] = (record["content"] or "新对话")[:48]
        REDIS_CONN.set(_conv_key(conv_id), json.dumps(conv, ensure_ascii=False), _TTL)
    return record


def save_feedback(conv_id: str, msg_id: str, feedback_type: str, *, correction_text: str = "") -> dict[str, Any] | None:
    raw = REDIS_CONN.lrange(_msg_key(conv_id), 0, -1)
    updated: dict[str, Any] | None = None
    new_list: list[str] = []
    for item in raw or []:
        try:
            msg = json.loads(_decode(item) or "{}")
        except json.JSONDecodeError:
            continue
        if msg.get("message_id") == msg_id:
            msg["feedback_status"] = feedback_type
            msg["metadata"] = {**(msg.get("metadata") or {}), "feedback_type": feedback_type}
            if correction_text:
                msg["metadata"]["correction_text"] = correction_text
            updated = msg
        new_list.append(json.dumps(msg, ensure_ascii=False))

    if not updated:
        return None
    REDIS_CONN.delete(_msg_key(conv_id))
    for s in new_list:
        REDIS_CONN.rpush(_msg_key(conv_id), s)
    REDIS_CONN.expire(_msg_key(conv_id), _TTL)
    return updated

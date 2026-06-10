#
# 对话检索上下文 — 与 dataset search 对齐的 KB/向量索引/嵌入模型解析
#
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def resolve_index_tenant_id(kb_id: str, requester_user_id: str | None = None) -> str | None:
    """解析向量索引所在租户（index: ragflow_{tenant_id}），与 dataset search 一致。"""
    from api.db.services.knowledgebase_service import KnowledgebaseService
    from api.db.services.user_service import UserTenantService

    ok, kb = KnowledgebaseService.get_by_id(kb_id)
    if not ok or not kb:
        return None

    owner_tid = (getattr(kb, "tenant_id", None) or "").strip()
    if not requester_user_id:
        return owner_tid or None

    try:
        memberships = UserTenantService.query(user_id=requester_user_id)
        for membership in memberships or []:
            member_tid = getattr(membership, "tenant_id", None)
            if member_tid and KnowledgebaseService.query(tenant_id=member_tid, id=kb_id):
                return str(member_tid)
    except Exception:
        logger.debug("resolve_index_tenant_id membership lookup failed", exc_info=True)

    return owner_tid or None


def resolve_kb_embedding_config(kb) -> dict[str, Any]:
    """解析与建索引一致的嵌入模型配置（优先 tenant_embd_id，其次 kb.embd_id）。"""
    from api.db.joint_services.tenant_model_service import (
        get_model_config_by_id,
        get_model_config_by_type_and_name,
        get_tenant_default_model_by_type,
    )
    from common.constants import LLMType

    owner_tid = kb.tenant_id
    embd_id = (getattr(kb, "embd_id", None) or "").strip()

    if getattr(kb, "tenant_embd_id", None):
        return get_model_config_by_id(kb.tenant_embd_id)
    if embd_id:
        return get_model_config_by_type_and_name(owner_tid, LLMType.EMBEDDING, embd_id)
    return get_tenant_default_model_by_type(owner_tid, LLMType.EMBEDDING)


def resolve_rank_feature_labels(query: str, kb) -> dict | None:
    """仅当 KB 配置了 tag_kb_ids 时才返回标签 rank_feature，避免误过滤。"""
    parser_config = getattr(kb, "parser_config", None) or {}
    if not parser_config.get("tag_kb_ids"):
        return None
    from rag.app.tag import label_question

    labels = label_question(query, [kb])
    return labels if labels else None


def build_retrieval_debug(
    *,
    kb_id: str,
    index_tenant_id: str | None,
    embd_model: str,
    rank_labels: dict | None,
    metadata_filters: dict | None,
    ranks: dict | None = None,
    hits_count: int = 0,
    error: str | None = None,
) -> dict[str, Any]:
    return {
        "kb_id": kb_id,
        "index_tenant_id": index_tenant_id,
        "index_name": f"ragflow_{index_tenant_id}" if index_tenant_id else None,
        "embd_model": embd_model,
        "tag_rank_labels": rank_labels,
        "metadata_filters": metadata_filters,
        "es_total": (ranks or {}).get("total"),
        "chunk_candidates": len((ranks or {}).get("chunks") or []),
        "hits_returned": hits_count,
        "error": error,
    }

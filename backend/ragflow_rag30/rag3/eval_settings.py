#
# 评测任务检索/生成配置 — 对齐知识库与租户模型
#
from __future__ import annotations

import logging
from typing import Any

from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
from api.db.services.knowledgebase_service import KnowledgebaseService
from common.constants import LLMType
from rag3.conversation_models import DEFAULT_CONVERSATION_SETTINGS, merge_settings

logger = logging.getLogger(__name__)


def _tenant_has_rerank(tenant_id: str) -> bool:
    try:
        get_tenant_default_model_by_type(tenant_id, LLMType.RERANK)
        return True
    except Exception:
        return False


def _tenant_has_chat(tenant_id: str) -> bool:
    try:
        get_tenant_default_model_by_type(tenant_id, LLMType.CHAT)
        return True
    except Exception:
        return False


def _tenant_has_embedding(tenant_id: str, kb) -> bool:
    from rag3.retrieval_context import resolve_kb_embedding_config

    try:
        resolve_kb_embedding_config(kb)
        return True
    except Exception as e:
        logger.warning("eval embedding unavailable kb=%s: %s", getattr(kb, "id", ""), e)
        return False


def build_eval_config_override(
    kb_id: str,
    tenant_id: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    为评测构造与对话一致的 settings：
    - 仅用 vector 通道（避免 wiki/graph 空结果稀释融合）
    - 无 rerank 模型时关闭精排（检索仍会走 RRF，不会清空结果）
    - 略降低相似度阈值以提高召回
    """
    settings: dict[str, Any] = dict(DEFAULT_CONVERSATION_SETTINGS)
    ok, kb = KnowledgebaseService.get_by_id(kb_id)
    if ok and kb:
        parser_config = getattr(kb, "parser_config", None) or {}
        llm_name = (parser_config.get("llm_id") or "").strip()
        if llm_name and "@" in llm_name:
            settings["llm_model"] = llm_name
        rerank_name = (parser_config.get("rerank_id") or "").strip()
        if rerank_name and "@" in rerank_name:
            settings["rerank_model"] = rerank_name

    settings["strategy"] = "immediate"
    settings["pipeline_ids"] = ["vector"]
    settings["channel_wiki"] = False
    settings["channel_pageindex"] = False
    settings["channel_graph"] = False
    settings["similarity_threshold"] = 0.15
    settings["top_k"] = 10

    if not _tenant_has_rerank(tenant_id):
        settings["use_rerank"] = False
        settings["rerank_model"] = ""
        logger.info("eval: no rerank model for tenant %s, use_rerank=false", tenant_id)

    if ok and kb and not _tenant_has_embedding(tenant_id, kb):
        logger.warning("eval: embedding model not configured for kb %s", kb_id)

    if not _tenant_has_chat(tenant_id):
        logger.warning("eval: no default chat model for tenant %s, RAGAS/judge may be skipped", tenant_id)

    merged = merge_settings(settings)
    if extra:
        merged.update(extra)
    return merged

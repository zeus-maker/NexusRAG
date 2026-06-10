"""Cross-Encoder 精排"""
from __future__ import annotations

import logging

from fusion.rrf_fusion import FusedHit

logger = logging.getLogger(__name__)


def rerank(
    query: str,
    hits: list[FusedHit],
    top_n: int = 5,
    *,
    tenant_id: str | None = None,
    use_rerank: bool = True,
) -> list[FusedHit]:
    if not hits:
        return []
    if not use_rerank or not tenant_id:
        return hits[:top_n]

    try:
        from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
        from api.db.services.llm_service import LLMBundle
        from common.constants import LLMType

        rerank_cfg = get_tenant_default_model_by_type(tenant_id, LLMType.RERANK)
        rerank_mdl = LLMBundle(tenant_id, rerank_cfg)
        texts = [h.snippet or h.doc_name or "" for h in hits]
        scores, _ = rerank_mdl.similarity(query, texts)
        if scores and len(scores) == len(hits):
            paired = sorted(zip(hits, scores), key=lambda x: x[1], reverse=True)
            return [h for h, _ in paired[:top_n]]
    except Exception:
        logger.debug("Rerank model unavailable, using RRF order", exc_info=True)

    return hits[:top_n]

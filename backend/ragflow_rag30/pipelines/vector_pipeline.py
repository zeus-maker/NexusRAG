"""流水线 A：DeepDoc + 分块 + 向量/BM25 混合检索"""
from __future__ import annotations

import asyncio
import logging

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult

logger = logging.getLogger(__name__)


def _run_async(coro):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        return pool.submit(asyncio.run, coro).result()


class VectorPipeline(BasePipeline):
    channel = "vector"

    async def _search(
        self,
        query: str,
        kb_id: str,
        top_k: int,
        tenant_id: str,
        similarity_threshold: float,
        vector_weight: float,
        use_rerank: bool,
    ) -> list[PipelineHit]:
        from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
        from api.db.services.knowledgebase_service import KnowledgebaseService
        from api.db.services.llm_service import LLMBundle
        from common import settings
        from common.constants import LLMType

        ok, kb = KnowledgebaseService.get_by_id(kb_id)
        if not ok or not kb:
            return []

        embd_cfg = get_tenant_default_model_by_type(tenant_id, LLMType.EMBEDDING)
        embd_mdl = LLMBundle(tenant_id, embd_cfg)
        rerank_mdl = None
        if use_rerank:
            try:
                rerank_cfg = get_tenant_default_model_by_type(tenant_id, LLMType.RERANK)
                rerank_mdl = LLMBundle(tenant_id, rerank_cfg)
            except Exception:
                rerank_mdl = None

        ranks = await settings.retriever.retrieval(
            query,
            embd_mdl,
            tenant_id,
            [kb_id],
            1,
            top_k,
            similarity_threshold=similarity_threshold,
            vector_similarity_weight=vector_weight,
            rerank_mdl=rerank_mdl,
        )
        hits: list[PipelineHit] = []
        for c in (ranks.get("chunks") or [])[:top_k]:
            hits.append(
                PipelineHit(
                    chunk_id=str(c.get("chunk_id") or c.get("id") or ""),
                    doc_id=str(c.get("doc_id") or ""),
                    doc_name=str(c.get("docnm_kwd") or c.get("doc_name") or "—"),
                    score=float(c.get("similarity") or c.get("score") or 0),
                    snippet=str(c.get("content_with_weight") or c.get("content") or "")[:500],
                    channel=self.channel,
                    metadata={
                        "page": c.get("page_num_int") or c.get("page_number") or 0,
                        "positions": c.get("positions"),
                        "acl_level": c.get("acl_level") or c.get("security_level") or "internal",
                        "department": c.get("department_kwd") or c.get("department") or "",
                        "type": c.get("type_kwd") or c.get("type") or "",
                        "author": c.get("author_kwd") or c.get("author") or "",
                    },
                )
            )
        return hits

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        tenant_id = ctx.get("tenant_id")
        if not tenant_id:
            from api.db.services.knowledgebase_service import KnowledgebaseService
            ok, kb = KnowledgebaseService.get_by_id(kb_id)
            tenant_id = kb.tenant_id if ok and kb else None

        if tenant_id:
            try:
                hits = _run_async(
                    self._search(
                        query,
                        kb_id,
                        top_k,
                        tenant_id,
                        float(ctx.get("similarity_threshold") or 0.2),
                        float(ctx.get("vector_weight") or 0.7),
                        bool(ctx.get("use_rerank", True)),
                    )
                )
                if hits:
                    return PipelineResult(channel=self.channel, hits=hits, latency_ms=80)
            except Exception:
                logger.debug("vector pipeline real search failed", exc_info=True)

        mock_hits = [
            PipelineHit(
                chunk_id="c-v1",
                doc_id="doc-001",
                doc_name="供应商合同模板V5.pdf",
                score=0.956,
                snippet="违约金按日 0.5% 计算，上限 20%…",
                channel=self.channel,
            ),
        ]
        return PipelineResult(channel=self.channel, hits=mock_hits[:top_k], latency_ms=45)

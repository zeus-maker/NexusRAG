"""流水线 C：GraphRAG 图谱检索"""
from __future__ import annotations

import asyncio
import logging
import time

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


class GraphPipeline(BasePipeline):
    channel = "graph"

    async def _search(self, query: str, kb_id: str, tenant_id: str) -> list[PipelineHit]:
        from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
        from api.db.services.knowledgebase_service import KnowledgebaseService
        from api.db.services.llm_service import LLMBundle
        from common import settings
        from common.constants import LLMType

        ok, kb = KnowledgebaseService.get_by_id(kb_id)
        if not ok or not kb:
            return []

        tid = tenant_id or kb.tenant_id
        embd_cfg = get_tenant_default_model_by_type(tid, LLMType.EMBEDDING)
        chat_cfg = get_tenant_default_model_by_type(tid, LLMType.CHAT)
        embd_mdl = LLMBundle(tid, embd_cfg)
        chat_mdl = LLMBundle(tid, chat_cfg)

        ck = await settings.kg_retriever.retrieval(
            query,
            [tid],
            [kb_id],
            embd_mdl,
            chat_mdl,
            ent_topn=6,
            rel_topn=6,
            comm_topn=1,
        )
        content = (ck or {}).get("content_with_weight") or ""
        if not content.strip():
            return []

        snippet = content[:800]
        return [
            PipelineHit(
                chunk_id=str(ck.get("chunk_id") or "kg-fused"),
                doc_id=str(ck.get("doc_id") or "knowledge-graph"),
                doc_name=str(ck.get("docnm_kwd") or "知识图谱检索"),
                score=float(ck.get("similarity") or 0.85),
                snippet=snippet,
                channel=self.channel,
                metadata={"source": "knowledge_graph", "acl_level": "internal"},
            )
        ]

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        t0 = time.time()
        tenant_id = ctx.get("tenant_id")
        if not tenant_id:
            from api.db.services.knowledgebase_service import KnowledgebaseService
            ok, kb = KnowledgebaseService.get_by_id(kb_id)
            tenant_id = kb.tenant_id if ok and kb else None

        if tenant_id:
            try:
                hits = _run_async(self._search(query, kb_id, tenant_id))
                if hits:
                    return PipelineResult(
                        channel=self.channel,
                        hits=hits[:top_k],
                        latency_ms=int((time.time() - t0) * 1000) or 820,
                    )
            except Exception:
                logger.debug("graph pipeline kg retrieval failed", exc_info=True)

        mock_hits = [
            PipelineHit(
                chunk_id="c-g1",
                doc_id="entity-penalty",
                doc_name="实体「违约金」",
                score=0.89,
                snippet="实体关系：违约金 —[定义于]→ 合同V5 第五条",
                channel=self.channel,
                metadata={"source": "mock", "acl_level": "internal"},
            ),
        ]
        return PipelineResult(channel=self.channel, hits=mock_hits[:top_k], latency_ms=820)

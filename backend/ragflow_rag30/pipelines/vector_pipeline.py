"""流水线 A：DeepDoc + 分块 + 向量/BM25 混合检索"""
from __future__ import annotations

import asyncio
import logging
import time

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult

logger = logging.getLogger(__name__)


def _hits_from_ranks(ranks: dict, channel: str, top_k: int) -> list[PipelineHit]:
    hits: list[PipelineHit] = []
    for c in (ranks.get("chunks") or [])[:top_k]:
        hits.append(
            PipelineHit(
                chunk_id=str(c.get("chunk_id") or c.get("id") or ""),
                doc_id=str(c.get("doc_id") or ""),
                doc_name=str(c.get("docnm_kwd") or c.get("doc_name") or "—"),
                score=float(c.get("similarity") or c.get("score") or 0),
                snippet=str(c.get("content_with_weight") or c.get("content") or "")[:500],
                channel=channel,
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
        requester_user_id: str | None,
        similarity_threshold: float,
        vector_weight: float,
        use_rerank: bool,
        rerank_model: str | None = None,
    ) -> tuple[list[PipelineHit], dict]:
        from api.db.joint_services.tenant_model_service import (
            get_model_config_by_type_and_name,
            get_tenant_default_model_by_type,
        )
        from api.db.services.knowledgebase_service import KnowledgebaseService
        from api.db.services.llm_service import LLMBundle
        from common import settings
        from common.constants import LLMType
        from rag3.retrieval_context import (
            build_retrieval_debug,
            resolve_index_tenant_id,
            resolve_kb_embedding_config,
            resolve_rank_feature_labels,
        )

        ok, kb = KnowledgebaseService.get_by_id(kb_id)
        if not ok or not kb:
            return [], build_retrieval_debug(
                kb_id=kb_id, index_tenant_id=None, embd_model="", rank_labels=None,
                metadata_filters=None, error="知识库不存在",
            )

        index_tid = resolve_index_tenant_id(kb_id, requester_user_id)
        if not index_tid:
            return [], build_retrieval_debug(
                kb_id=kb_id, index_tenant_id=None, embd_model="", rank_labels=None,
                metadata_filters=None, error="无法解析向量索引租户",
            )

        try:
            embd_cfg = resolve_kb_embedding_config(kb)
        except Exception as ex:
            logger.warning("resolve_kb_embedding_config failed kb=%s", kb_id, exc_info=True)
            return [], build_retrieval_debug(
                kb_id=kb_id, index_tenant_id=index_tid, embd_model="", rank_labels=None,
                metadata_filters=None, error=f"嵌入模型不可用: {ex}",
            )

        embd_model_name = str(embd_cfg.get("llm_name") or embd_cfg.get("model_name") or "")
        embd_mdl = LLMBundle(index_tid, embd_cfg)

        rerank_mdl = None
        if use_rerank:
            try:
                if rerank_model:
                    rerank_cfg = get_model_config_by_type_and_name(index_tid, LLMType.RERANK, rerank_model)
                else:
                    rerank_cfg = get_tenant_default_model_by_type(index_tid, LLMType.RERANK)
                rerank_mdl = LLMBundle(index_tid, rerank_cfg)
            except Exception:
                logger.warning("Rerank model unavailable, vector retrieval without inline rerank", exc_info=True)

        rank_labels = resolve_rank_feature_labels(query, kb)

        async def _retrieve(threshold: float, with_rerank: bool) -> dict:
            return await settings.retriever.retrieval(
                query,
                embd_mdl,
                index_tid,
                [kb_id],
                1,
                top_k,
                similarity_threshold=threshold,
                vector_similarity_weight=vector_weight,
                top=max(top_k, 64),
                rerank_mdl=rerank_mdl if with_rerank else None,
                rank_feature=rank_labels,
            )

        err_msg = None
        try:
            ranks = await _retrieve(similarity_threshold, use_rerank and rerank_mdl is not None)
        except Exception as ex:
            err_msg = str(ex)
            logger.warning("vector retrieval failed, retry without rerank", exc_info=True)
            ranks = await _retrieve(similarity_threshold, False)

        hits = _hits_from_ranks(ranks, self.channel, top_k)
        debug = build_retrieval_debug(
            kb_id=kb_id,
            index_tenant_id=index_tid,
            embd_model=embd_model_name,
            rank_labels=rank_labels,
            metadata_filters=None,
            ranks=ranks,
            hits_count=len(hits),
            error=err_msg,
        )

        if not hits:
            logger.warning(
                "vector pipeline empty: kb=%s index=%s embd=%s tags=%s es_total=%s query=%r",
                kb_id,
                debug.get("index_name"),
                embd_model_name,
                bool(rank_labels),
                ranks.get("total"),
                query[:80],
            )
        return hits, debug

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        t0 = time.time()
        requester_user_id = ctx.get("requester_user_id") or ctx.get("tenant_id")
        similarity_threshold = float(ctx.get("similarity_threshold", 0.2))
        vector_weight = float(ctx.get("vector_weight", 0.7))

        try:
            hits, debug = _run_async(
                self._search(
                    query,
                    kb_id,
                    top_k,
                    requester_user_id,
                    similarity_threshold,
                    vector_weight,
                    bool(ctx.get("use_rerank", True)),
                    (ctx.get("rerank_model") or "").strip() or None,
                )
            )
            latency = int((time.time() - t0) * 1000) or 1
            return PipelineResult(
                channel=self.channel,
                hits=hits,
                latency_ms=latency,
                error=debug.get("error"),
                debug=debug,
            )
        except Exception as ex:
            logger.warning("vector pipeline failed", exc_info=True)
            return PipelineResult(
                channel=self.channel,
                hits=[],
                latency_ms=int((time.time() - t0) * 1000) or 1,
                error=str(ex),
            )

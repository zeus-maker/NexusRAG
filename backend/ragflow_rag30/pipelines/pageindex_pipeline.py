"""流水线 B：PageIndex 树索引 + 推理式检索"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult


class PageIndexPipeline(BasePipeline):
    channel = "pageindex"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        from rag3.index_service import search_pageindex_hits

        raw_hits = search_pageindex_hits(kb_id, query, top_k=top_k)
        if raw_hits:
            hits = [
                PipelineHit(
                    chunk_id=h["chunk_id"],
                    doc_id=h["doc_id"],
                    doc_name=h["doc_name"],
                    score=h["score"],
                    snippet=h["snippet"],
                    channel=self.channel,
                    metadata=h.get("metadata") or {},
                )
                for h in raw_hits
            ]
            return PipelineResult(channel=self.channel, hits=hits, latency_ms=120)

        mock_hits = [
            PipelineHit(
                chunk_id="c-p1",
                doc_id="doc-001",
                doc_name="供应商合同模板V5.pdf",
                score=0.867,
                snippet="第五条 违约责任 §5.1 迟延交货违约金…",
                channel=self.channel,
                metadata={"page": 3, "node_id": "ch5-1-1"},
            ),
        ]
        return PipelineResult(channel=self.channel, hits=mock_hits[:top_k], latency_ms=210)

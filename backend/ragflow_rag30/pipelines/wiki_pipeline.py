"""流水线 D：LLM Wiki 编译知识直接读取"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult


class WikiPipeline(BasePipeline):
    channel = "wiki"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        from rag3.index_service import search_wiki_hits

        raw_hits = search_wiki_hits(kb_id, query, top_k=top_k)
        if raw_hits:
            hits = [
                PipelineHit(
                    chunk_id=h["chunk_id"],
                    doc_id=h["doc_id"],
                    doc_name=h["doc_name"],
                    score=h["score"],
                    snippet=h["snippet"],
                    channel=self.channel,
                )
                for h in raw_hits
            ]
            return PipelineResult(channel=self.channel, hits=hits, latency_ms=25)

        return PipelineResult(channel=self.channel, hits=[], latency_ms=1)

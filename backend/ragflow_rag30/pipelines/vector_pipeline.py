"""流水线 A：DeepDoc + 分块 + 向量/BM25 混合检索（复用 RAGFlow rag/）"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult


class VectorPipeline(BasePipeline):
    channel = "vector"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        # TODO: 接入 rag/nlp + doc_store 真实检索
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

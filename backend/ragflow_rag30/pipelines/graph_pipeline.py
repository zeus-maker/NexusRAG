"""流水线 C：GraphRAG 图谱遍历"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult


class GraphPipeline(BasePipeline):
    channel = "graph"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        mock_hits = [
            PipelineHit(
                chunk_id="c-g1",
                doc_id="entity-penalty",
                doc_name="实体「违约金」",
                score=0.89,
                snippet="实体关系：违约金 —[定义于]→ 合同V5 第五条",
                channel=self.channel,
            ),
        ]
        return PipelineResult(channel=self.channel, hits=mock_hits[:top_k], latency_ms=820)

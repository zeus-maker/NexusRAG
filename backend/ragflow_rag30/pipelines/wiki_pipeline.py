"""流水线 D：LLM Wiki 编译知识直接读取"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineHit, PipelineResult


class WikiPipeline(BasePipeline):
    channel = "wiki"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        mock_hits = [
            PipelineHit(
                chunk_id="c-w1",
                doc_id="wiki-penalty",
                doc_name="Wiki: 供应商违约金",
                score=0.98,
                snippet="标准：每日 0.5%，上限 20%。适用于采购类合同。",
                channel=self.channel,
            ),
        ]
        return PipelineResult(channel=self.channel, hits=mock_hits[:top_k], latency_ms=18)

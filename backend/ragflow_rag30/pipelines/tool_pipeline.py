"""流水线 E：Agent 工具调用 / MCP"""
from __future__ import annotations

from pipelines.base_pipeline import BasePipeline, PipelineResult


class ToolPipeline(BasePipeline):
    channel = "tool"

    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx) -> PipelineResult:
        return PipelineResult(channel=self.channel, hits=[], latency_ms=0, error=None)

"""RRF 多通道融合（技术方案 §33）"""
from __future__ import annotations

from dataclasses import dataclass

from pipelines.base_pipeline import PipelineHit, PipelineResult


@dataclass
class FusedHit:
    chunk_id: str
    doc_name: str
    wrrf_score: float
    snippet: str
    sources: list[str]
    rank: int = 0


def reciprocal_rank_fusion(
    results: list[PipelineResult],
    k: int = 60,
    channel_weights: dict[str, float] | None = None,
) -> list[FusedHit]:
    weights = channel_weights or {"wiki": 1.5, "pageindex": 1.3, "vector": 1.0, "graph": 1.0, "tool": 0.5}
    merged: dict[str, FusedHit] = {}

    for res in results:
        if res.error or not res.hits:
            continue
        w = weights.get(res.channel, 1.0)
        for rank, hit in enumerate(res.hits, start=1):
            key = hit.chunk_id
            contrib = w * (1.0 / (k + rank))
            if key in merged:
                merged[key].wrrf_score += contrib
                if res.channel not in merged[key].sources:
                    merged[key].sources.append(res.channel)
            else:
                merged[key] = FusedHit(
                    chunk_id=hit.chunk_id,
                    doc_name=hit.doc_name,
                    wrrf_score=contrib,
                    snippet=hit.snippet,
                    sources=[res.channel],
                )

    fused = sorted(merged.values(), key=lambda h: h.wrrf_score, reverse=True)
    for i, h in enumerate(fused, start=1):
        h.rank = i
        h.wrrf_score = round(h.wrrf_score, 4)
    return fused

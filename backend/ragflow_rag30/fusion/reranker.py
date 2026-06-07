"""Cross-Encoder 精排占位"""
from __future__ import annotations

from fusion.rrf_fusion import FusedHit


def rerank(query: str, hits: list[FusedHit], top_n: int = 5) -> list[FusedHit]:
    # TODO: 接入 rag/llm RerankModel
    return hits[:top_n]

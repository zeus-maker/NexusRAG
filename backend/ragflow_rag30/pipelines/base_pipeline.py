"""
流水线基类 — 各通道统一 run(query, kb_id, **ctx) 接口
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PipelineHit:
    chunk_id: str
    doc_id: str
    doc_name: str
    score: float
    snippet: str
    channel: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineResult:
    channel: str
    hits: list[PipelineHit]
    latency_ms: int
    error: str | None = None
    debug: dict | None = None


class BasePipeline(ABC):
    channel: str = "base"

    @abstractmethod
    def run(self, query: str, kb_id: str, top_k: int = 10, **ctx: Any) -> PipelineResult:
        ...

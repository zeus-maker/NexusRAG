#
# RAGFlow 嵌入模型 → RAGAS Embeddings 适配
#
from __future__ import annotations

from typing import List

from ragas.embeddings.base import BaseRagasEmbeddings
from ragas.run_config import RunConfig


class RagflowRagasEmbeddings(BaseRagasEmbeddings):
    """将租户嵌入 LLMBundle 包装为 RAGAS answer_relevancy 等所需的 embeddings。"""

    def __init__(self, bundle: object, run_config: RunConfig | None = None):
        self.bundle = bundle
        self.set_run_config(run_config or RunConfig())

    def embed_query(self, text: str) -> List[float]:
        vec, _ = self.bundle.encode_queries(text)
        return list(vec)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        vecs, _ = self.bundle.encode(texts)
        return [list(v) for v in vecs]

    async def aembed_query(self, text: str) -> List[float]:
        return self.embed_query(text)

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.embed_documents(texts)

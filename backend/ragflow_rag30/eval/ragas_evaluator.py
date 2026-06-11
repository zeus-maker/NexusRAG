#
# RAGAS evaluation integration — 绕过 ragas.evaluate() Executor（Py3.13 event loop 死锁）
#
from __future__ import annotations

import asyncio
import logging
import math
from concurrent.futures import ThreadPoolExecutor
from typing import Any

logger = logging.getLogger(__name__)

_RAGAS_POOL = ThreadPoolExecutor(max_workers=1, thread_name_prefix="ragas-eval")
_EMBEDDING_METRICS = frozenset({"answer_relevancy", "context_precision", "context_recall"})


def _row_for_ragas(
    question: str,
    answer: str,
    contexts: list[str],
    ground_truth: str | None,
) -> dict[str, Any]:
    """RAGAS faithfulness 分句仅认英文句号，中文答案先归一化。"""
    normalized = (
        (answer or "")
        .replace("。", ".")
        .replace("！", ".")
        .replace("？", ".")
        .replace("；", ".")
    )
    row: dict[str, Any] = {
        "question": question,
        "answer": normalized,
        "contexts": contexts,
    }
    if ground_truth:
        row["ground_truth"] = ground_truth
    return row


class RAGASEvaluator:
    """Wrap ragas metrics with tenant LLM as judge."""

    def __init__(self, tenant_id: str, llm_model: str = ""):
        self.tenant_id = tenant_id
        self.llm_model = llm_model

    def _build_llm(self):
        from api.db.joint_services.tenant_model_service import (
            get_model_config_by_type_and_name,
            get_tenant_default_model_by_type,
        )
        from api.db.services.llm_service import LLMBundle
        from common.constants import LLMType
        from eval.ragflow_ragas_llm import RagflowRagasLLM

        if self.llm_model:
            cfg = get_model_config_by_type_and_name(self.tenant_id, LLMType.CHAT, self.llm_model)
        else:
            cfg = get_tenant_default_model_by_type(self.tenant_id, LLMType.CHAT)
        bundle = LLMBundle(self.tenant_id, cfg)
        return RagflowRagasLLM(bundle=bundle)

    def _build_embeddings(self):
        from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
        from api.db.services.llm_service import LLMBundle
        from common.constants import LLMType
        from eval.ragflow_ragas_embeddings import RagflowRagasEmbeddings

        cfg = get_tenant_default_model_by_type(self.tenant_id, LLMType.EMBEDDING)
        bundle = LLMBundle(self.tenant_id, cfg)
        return RagflowRagasEmbeddings(bundle=bundle)

    @staticmethod
    def _metric_instances(names: set[str]) -> list[tuple[str, Any]]:
        from ragas.metrics._answer_relevance import AnswerRelevancy
        from ragas.metrics._context_precision import ContextPrecision
        from ragas.metrics._context_recall import ContextRecall
        from ragas.metrics._faithfulness import Faithfulness

        mapping = {
            "faithfulness": Faithfulness,
            "answer_relevancy": AnswerRelevancy,
            "context_precision": ContextPrecision,
            "context_recall": ContextRecall,
        }
        return [(name, mapping[name]()) for name in names if name in mapping]

    @staticmethod
    def _run_metrics_sync(
        row: dict[str, Any],
        metric_entries: list[tuple[str, Any]],
        judge_llm,
        embeddings,
        timeout: int,
    ) -> dict[str, float]:
        from ragas.run_config import RunConfig

        run_config = RunConfig(timeout=timeout, max_workers=1)
        out: dict[str, float] = {}

        for name, metric in metric_entries:
            metric.llm = judge_llm
            if name in _EMBEDDING_METRICS and embeddings is not None:
                metric.embeddings = embeddings
            metric.init(run_config)

        async def _score_all() -> dict[str, float]:
            scores: dict[str, float] = {}
            for name, metric in metric_entries:
                try:
                    val = await metric.ascore(row, timeout=timeout)
                    if val is not None and not (isinstance(val, float) and math.isnan(val)):
                        scores[name] = round(float(val), 4)
                except Exception as exc:
                    logger.warning("RAGAS metric %s failed: %s", name, exc)
            return scores

        return asyncio.run(_score_all())

    def evaluate_single(
        self,
        question: str,
        answer: str,
        contexts: list[str],
        ground_truth: str | None = None,
        metrics: list[str] | None = None,
        *,
        timeout_seconds: int = 120,
    ) -> dict[str, float]:
        if not answer or not contexts:
            return {}

        requested = set(metrics or ["faithfulness", "answer_relevancy"])
        metric_entries = self._metric_instances(requested)
        if not metric_entries:
            return {}

        try:
            judge_llm = self._build_llm()
            embeddings = self._build_embeddings() if requested & _EMBEDDING_METRICS else None
            row = _row_for_ragas(question, answer, contexts, ground_truth)

            future = _RAGAS_POOL.submit(
                self._run_metrics_sync,
                row,
                metric_entries,
                judge_llm,
                embeddings,
                timeout_seconds,
            )
            return future.result(timeout=timeout_seconds + 15)
        except Exception as e:
            logger.warning("RAGAS evaluation failed: %s", e)
            return {}

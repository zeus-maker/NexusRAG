#
# RAG3 evaluation runner — async batch execution with RAGAS
#
from __future__ import annotations

import asyncio
import logging
import threading
from typing import Any

from api.db.db_models import EvaluationCase, EvaluationResult, EvaluationRun
from api.db.services.evaluation_service import EvaluationService
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp
from eval.metrics import (
    aggregate_metrics,
    compute_basic_generation_metrics,
    compute_proxy_retrieval_metrics,
    compute_retrieval_metrics,
)
from eval.ragas_evaluator import RAGASEvaluator
from rag3.chat_service import execute_chat_turn
from rag3.eval_settings import build_eval_config_override

logger = logging.getLogger(__name__)

_RUN_CANCEL: dict[str, threading.Event] = {}
_RUN_LOCK = threading.Lock()


def request_stop(run_id: str) -> None:
    with _RUN_LOCK:
        ev = _RUN_CANCEL.get(run_id)
        if ev:
            ev.set()


def _is_cancelled(run_id: str) -> bool:
    with _RUN_LOCK:
        ev = _RUN_CANCEL.get(run_id)
        return bool(ev and ev.is_set())


def _register_cancel(run_id: str) -> threading.Event:
    with _RUN_LOCK:
        ev = threading.Event()
        _RUN_CANCEL[run_id] = ev
        return ev


def _clear_cancel(run_id: str) -> None:
    with _RUN_LOCK:
        _RUN_CANCEL.pop(run_id, None)


def _update_run(run_id: str, **kwargs: Any) -> None:
    EvaluationRun.update(**kwargs).where(EvaluationRun.id == run_id).execute()


def _merge_generation_metrics(
    metric_values: dict[str, float],
    question: str,
    answer: str,
    contexts: list[str],
    reference: str | None,
    ragas_metrics: list[str],
) -> None:
    """RAGAS 未产出某指标时用基础代理指标补齐。"""
    basic = compute_basic_generation_metrics(question, answer, contexts, reference)
    for key in ragas_metrics:
        if key not in metric_values and key in basic:
            metric_values[key] = basic[key]
    if "hallucination_rate" not in metric_values and "faithfulness" in metric_values:
        metric_values["hallucination_rate"] = round(max(0.0, 1.0 - metric_values["faithfulness"]), 4)
    elif "hallucination_rate" not in metric_values:
        metric_values["hallucination_rate"] = basic.get("hallucination_rate", 0.0)


async def _eval_case(
    run_id: str,
    case: dict[str, Any],
    *,
    kb_id: str,
    tenant_id: str,
    config_override: dict[str, Any],
    evaluation_type: str,
    metrics: list[str],
) -> dict[str, Any] | None:
    settings = build_eval_config_override(kb_id, tenant_id, config_override)
    question = case.get("question") or ""

    try:
        result = await execute_chat_turn(
            question,
            kb_id,
            tenant_id=tenant_id,
            user_roles=["admin"],
            settings=settings,
            pipeline_ids=settings.get("pipeline_ids") or ["vector"],
            use_llm=evaluation_type != "retrieval",
        )
        if result.get("error"):
            logger.warning("eval case error: %s — %s", case.get("id"), result.get("error"))
            return None

        answer = result.get("answer") or result.get("content") or ""
        fusion = result.get("fusion") or []
        retrieved_ids = [str(h.get("chunk_id") or "") for h in fusion if h.get("chunk_id")]
        contexts = [
            str(h.get("snippet") or h.get("doc_name") or "")
            for h in fusion
            if (h.get("snippet") or h.get("doc_name"))
        ]

        trace = result.get("trace") or {}
        metric_values: dict[str, float] = {
            "retrieval_hit_count": float(len(retrieved_ids)),
        }

        if evaluation_type in ("retrieval", "end_to_end", "compare"):
            gold_chunks = case.get("relevant_chunk_ids")
            if gold_chunks:
                metric_values.update(compute_retrieval_metrics(retrieved_ids, gold_chunks))
            else:
                metric_values.update(compute_proxy_retrieval_metrics(retrieved_ids))

        if evaluation_type in ("generation", "end_to_end", "compare"):
            ragas_metrics = [m for m in metrics if m in (
                "faithfulness", "answer_relevancy", "context_precision", "context_recall",
            )]
            if ragas_metrics:
                if contexts:
                    try:
                        evaluator = RAGASEvaluator(tenant_id, settings.get("llm_model") or "")
                        ragas_scores = await asyncio.to_thread(
                            evaluator.evaluate_single,
                            question,
                            answer,
                            contexts,
                            case.get("reference_answer"),
                            ragas_metrics,
                        )
                        metric_values.update(ragas_scores)
                    except Exception as e:
                        logger.warning("RAGAS failed for case %s: %s", case.get("id"), e)
                _merge_generation_metrics(
                    metric_values,
                    question,
                    answer,
                    contexts,
                    case.get("reference_answer"),
                    ragas_metrics,
                )

        if not retrieved_ids:
            logger.warning(
                "eval case %s: zero retrieval hits kb=%s query=%r trace_channels=%s",
                case.get("id"),
                kb_id,
                question[:60],
                trace.get("channels"),
            )

        exec_time = float((result.get("latency_ms") or {}).get("total", 0)) / 1000.0
        result_id = get_uuid()
        row = {
            "id": result_id,
            "run_id": run_id,
            "case_id": case["id"],
            "question": question,
            "generated_answer": answer,
            "reference_answer": case.get("reference_answer"),
            "retrieved_chunks": fusion,
            "metrics": metric_values,
            "execution_time": exec_time,
            "token_usage": result.get("token_usage"),
            "create_time": current_timestamp(),
        }
        EvaluationResult.create(**row)
        return row
    except Exception as e:
        logger.exception("eval case %s failed: %s", case.get("id"), e)
        return None


async def _run_async(
    run_id: str,
    *,
    tenant_id: str,
    kb_id: str,
    dataset_id: str,
    evaluation_type: str,
    metrics: list[str],
    config_override: dict[str, Any],
) -> None:
    _register_cancel(run_id)
    try:
        cases = EvaluationService.get_test_cases(dataset_id)
        total = len(cases)
        if not total:
            _update_run(run_id, status="FAILED", error_message="数据集无样本", complete_time=current_timestamp())
            return

        _update_run(run_id, metrics_summary={"total_cases": total, "case_count": 0}, progress=0)
        results: list[dict[str, Any]] = []
        zero_hit = 0
        for idx, case in enumerate(cases):
            if _is_cancelled(run_id):
                _update_run(run_id, status="STOPPED", progress=int(idx / total * 100), complete_time=current_timestamp())
                return

            row = await _eval_case(
                run_id,
                case,
                kb_id=kb_id,
                tenant_id=tenant_id,
                config_override=config_override,
                evaluation_type=evaluation_type,
                metrics=metrics,
            )
            if row:
                results.append(row)
                if not (row.get("metrics") or {}).get("retrieval_hit_count"):
                    zero_hit += 1
            progress = int((idx + 1) / total * 100)
            _update_run(run_id, progress=progress)

        summary = aggregate_metrics(results)
        summary["total_cases"] = total
        summary["zero_retrieval_cases"] = zero_hit
        if zero_hit == total and total > 0:
            summary["diagnosis"] = (
                "全部样本检索为空：请检查知识库文档是否已解析完成、租户是否配置嵌入模型；"
                "rerank 未配置时系统会自动关闭精排，通常不是根因。"
            )
        elif zero_hit > 0:
            summary["diagnosis"] = f"{zero_hit}/{total} 条样本未检索到片段"

        _update_run(
            run_id,
            status="COMPLETED",
            metrics_summary=summary,
            progress=100,
            complete_time=current_timestamp(),
        )
    except Exception as e:
        logger.exception("evaluation run %s failed", run_id)
        _update_run(run_id, status="FAILED", error_message=str(e), complete_time=current_timestamp())
    finally:
        _clear_cancel(run_id)


def start_run_background(
    run_id: str,
    *,
    tenant_id: str,
    kb_id: str,
    dataset_id: str,
    evaluation_type: str,
    metrics: list[str],
    config_override: dict[str, Any] | None = None,
) -> None:
    def _runner():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(
                _run_async(
                    run_id,
                    tenant_id=tenant_id,
                    kb_id=kb_id,
                    dataset_id=dataset_id,
                    evaluation_type=evaluation_type,
                    metrics=metrics,
                    config_override=config_override or {},
                )
            )
        finally:
            loop.close()

    threading.Thread(target=_runner, daemon=True).start()


def create_and_start_run(
    *,
    tenant_id: str,
    user_id: str,
    name: str,
    dataset_id: str,
    kb_id: str,
    evaluation_type: str = "end_to_end",
    metrics: list[str] | None = None,
    config_override: dict[str, Any] | None = None,
) -> tuple[bool, str]:
    try:
        run_id = get_uuid()
        metric_list = metrics or ["faithfulness", "answer_relevancy", "recall@10", "mrr"]
        merged_config = build_eval_config_override(kb_id, tenant_id, config_override)
        run = {
            "id": run_id,
            "tenant_id": tenant_id,
            "dataset_id": dataset_id,
            "dialog_id": None,
            "kb_id": kb_id,
            "name": name,
            "evaluation_type": evaluation_type,
            "metrics": metric_list,
            "config_snapshot": merged_config,
            "config_override": merged_config,
            "metrics_summary": None,
            "status": "RUNNING",
            "progress": 0,
            "created_by": user_id,
            "create_time": current_timestamp(),
            "complete_time": None,
        }
        if not EvaluationRun.create(**run):
            return False, "创建评测任务失败"

        start_run_background(
            run_id,
            tenant_id=tenant_id,
            kb_id=kb_id,
            dataset_id=dataset_id,
            evaluation_type=evaluation_type,
            metrics=metric_list,
            config_override=merged_config,
        )
        return True, run_id
    except Exception as e:
        logger.exception("create_and_start_run failed")
        return False, str(e)

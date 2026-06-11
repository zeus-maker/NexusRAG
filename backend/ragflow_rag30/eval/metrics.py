#
# RAG3 evaluation metrics — retrieval + text similarity
#
from __future__ import annotations

import math
from typing import Any


def compute_retrieval_metrics(
    retrieved_ids: list[str],
    relevant_ids: list[str] | None,
    *,
    k_values: tuple[int, ...] = (5, 10, 20),
) -> dict[str, float]:
    if not relevant_ids:
        return {}

    retrieved_set = set(retrieved_ids)
    relevant_set = set(relevant_ids)
    intersection = retrieved_set & relevant_set

    precision = len(intersection) / len(retrieved_set) if retrieved_set else 0.0
    recall = len(intersection) / len(relevant_set) if relevant_set else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    hit_rate = 1.0 if intersection else 0.0

    mrr = 0.0
    for i, chunk_id in enumerate(retrieved_ids, 1):
        if chunk_id in relevant_set:
            mrr = 1.0 / i
            break

    metrics: dict[str, float] = {
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "hit_rate": hit_rate,
        "mrr": mrr,
    }

    for k in k_values:
        top_k = retrieved_ids[:k]
        rel_in_top = sum(1 for cid in top_k if cid in relevant_set)
        metrics[f"precision@{k}"] = rel_in_top / k if k else 0.0
        metrics[f"recall@{k}"] = rel_in_top / len(relevant_set) if relevant_set else 0.0
        dcg = sum(1.0 / math.log2(i + 2) for i, cid in enumerate(top_k) if cid in relevant_set)
        ideal = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(relevant_set))))
        metrics[f"ndcg@{k}"] = dcg / ideal if ideal > 0 else 0.0

    return metrics


def compute_proxy_retrieval_metrics(retrieved_ids: list[str]) -> dict[str, float]:
    """无 relevant_chunk_ids 标注时的检索可观测指标（非 gold recall）。"""
    n = len([x for x in retrieved_ids if x])
    if n == 0:
        return {"hit_rate": 0.0, "retrieval_hit_count": 0.0, "recall@10": 0.0}
    return {
        "hit_rate": 1.0,
        "retrieval_hit_count": float(n),
        "recall@10": min(1.0, n / 10.0),
        "mrr": 1.0 if n else 0.0,
    }


def _token_set(text: str) -> set[str]:
    import re
    return {t for t in re.findall(r"[\w\u4e00-\u9fff]+", (text or "").lower()) if len(t) > 1}


def compute_basic_generation_metrics(
    question: str,
    answer: str,
    contexts: list[str],
    reference: str | None,
) -> dict[str, float]:
    """RAGAS 不可用时的基础生成指标（词重叠代理）。"""
    ans = (answer or "").strip()
    if not ans or "未在知识库中找到" in ans or "未找到足够信息" in ans:
        return {
            "faithfulness": 0.0,
            "answer_relevancy": 0.0,
            "context_precision": 0.0,
            "hallucination_rate": 1.0,
            "has_answer": 0.0,
        }

    ctx_text = " ".join(contexts)
    ans_tokens = _token_set(ans)
    ctx_tokens = _token_set(ctx_text)
    ref_tokens = _token_set(reference or "")

    faith = 0.0
    if ans_tokens and ctx_tokens:
        faith = min(1.0, len(ans_tokens & ctx_tokens) / max(1, len(ans_tokens)) * 1.5)
    elif contexts:
        faith = 0.3

    relevancy = 0.0
    q_tokens = _token_set(question)
    if ans_tokens and q_tokens:
        relevancy = min(1.0, len(ans_tokens & q_tokens) / max(1, len(q_tokens)) * 1.2)
    if ref_tokens and ans_tokens:
        relevancy = max(relevancy, min(1.0, len(ans_tokens & ref_tokens) / max(1, len(ref_tokens))))

    cp = min(1.0, len(ctx_tokens & (ans_tokens | q_tokens)) / max(1, len(ctx_tokens))) if ctx_tokens else 0.0

    return {
        "faithfulness": round(faith, 4),
        "answer_relevancy": round(relevancy, 4),
        "context_precision": round(cp, 4),
        "hallucination_rate": round(max(0.0, 1.0 - faith), 4),
        "has_answer": 1.0,
    }


def aggregate_metrics(results: list[dict[str, Any]]) -> dict[str, Any]:
    if not results:
        return {}

    sums: dict[str, float] = {}
    counts: dict[str, int] = {}
    for row in results:
        for key, val in (row.get("metrics") or {}).items():
            if isinstance(val, (int, float)):
                sums[key] = sums.get(key, 0.0) + float(val)
                counts[key] = counts.get(key, 0) + 1

    summary = {k: round(sums[k] / counts[k], 4) for k in sums if counts.get(k)}
    summary["case_count"] = len(results)
    return summary

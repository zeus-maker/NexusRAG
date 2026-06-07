"""
RAG 3.0 路由引擎：分类 → 决策矩阵 → 流水线调度计划
"""
from __future__ import annotations

from dataclasses import dataclass, field

from router.classifier import ClassificationResult, classify_query
from router.routing_rules import PipelineId, RoutingDecision, decide_route


@dataclass
class PipelinePlan:
    query: str
    classification: ClassificationResult
    decision: RoutingDecision
    pipeline_ids: list[PipelineId] = field(default_factory=list)


class RouterEngine:
    def plan(self, query: str, user_roles: list[str] | None = None, kb_id: str | None = None) -> PipelinePlan:
        clf = classify_query(query, user_roles)
        decision = decide_route(
            clf.query_tier,
            clf.doc_type,
            clf.user_intent,
            clf.security_tier,
        )
        ids: list[PipelineId] = []
        if not decision.skip_retrieval:
            ids.append(decision.primary)
            ids.extend(p for p in decision.auxiliary if p not in ids)
        return PipelinePlan(
            query=query,
            classification=clf,
            decision=decision,
            pipeline_ids=ids,
        )

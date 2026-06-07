"""
RAG 3.0 路由决策矩阵（技术方案 §3.3 简化版）
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PipelineId = Literal["vector", "pageindex", "graph", "wiki", "tool"]

QueryTier = Literal["tier1", "tier2", "tier3", "tier4"]
DocType = Literal["contract", "financial", "paper", "email", "general"]
UserIntent = Literal["factual", "analysis", "advice", "action", "chitchat"]
SecurityTier = Literal["public", "internal", "confidential", "restricted"]


@dataclass(frozen=True)
class RoutingDecision:
    primary: PipelineId
    auxiliary: tuple[PipelineId, ...]
    use_fusion: bool
    skip_retrieval: bool
    reason: str


def decide_route(
    tier: QueryTier,
    doc_type: DocType,
    intent: UserIntent,
    security: SecurityTier,
) -> RoutingDecision:
    """规则引擎：后续可换 LangGraph / 学习式路由。"""
    if intent == "chitchat":
        return RoutingDecision("vector", (), False, True, "闲聊跳过检索")

    if tier == "tier1" and doc_type == "financial":
        return RoutingDecision("vector", ("wiki",), True, False, "简单事实+Wiki缓存")

    if tier == "tier1" and doc_type == "contract":
        return RoutingDecision("pageindex", (), False, False, "合同精确条款→PageIndex")

    if tier in ("tier2", "tier3") and doc_type == "paper":
        return RoutingDecision("pageindex", ("graph",), True, False, "多跳推理+图谱辅助")

    if tier == "tier3":
        return RoutingDecision("vector", ("graph",), True, False, "跨文档综合")

    if tier == "tier4":
        return RoutingDecision("tool", ("graph",), False, False, "开放探索→工具+图谱")

    if security in ("confidential", "restricted"):
        return RoutingDecision("pageindex", ("vector",), True, False, "高敏优先树检索+ACL")

    return RoutingDecision("vector", ("pageindex",), True, False, "默认向量+PageIndex兜底")

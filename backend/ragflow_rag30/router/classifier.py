"""
四分类器入口（查询复杂度 / 文档类型 / 用户意图 / 安全分级）
技术方案 §3.2 — 首版规则 mock，后续接 LLM 小模型。
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from router.routing_rules import DocType, QueryTier, SecurityTier, UserIntent


@dataclass
class ClassificationResult:
    query_tier: QueryTier
    doc_type: DocType
    user_intent: UserIntent
    security_tier: SecurityTier
    confidence: float


_FINANCIAL_KW = re.compile(r"比率|营收|利润|财报|流动|资产负债", re.I)
_CONTRACT_KW = re.compile(r"合同|违约|条款|保密|解除", re.I)
_ANALYSIS_KW = re.compile(r"分析|对比|综合|评估|为什么", re.I)
_CHITCHAT_KW = re.compile(r"^(你好|谢谢|再见|hello|hi)\b", re.I)


def classify_query(query: str, user_roles: list[str] | None = None) -> ClassificationResult:
    """规则分类器占位；生产环境替换为 gpt-4o-mini / 本地小模型。"""
    roles = user_roles or ["internal"]
    q = (query or "").strip()

    if _CHITCHAT_KW.search(q):
        return ClassificationResult("tier1", "general", "chitchat", "public", 0.95)

    doc_type: DocType = "general"
    if _CONTRACT_KW.search(q):
        doc_type = "contract"
    elif _FINANCIAL_KW.search(q):
        doc_type = "financial"

    intent: UserIntent = "factual"
    if _ANALYSIS_KW.search(q):
        intent = "analysis"
    elif len(q) > 80:
        intent = "analysis"

    tier: QueryTier = "tier1"
    if intent == "analysis" and doc_type in ("contract", "financial"):
        tier = "tier2"
    if "跨" in q or "对比" in q and "文档" in q:
        tier = "tier3"
    if "探索" in q or "建议" in q:
        tier = "tier4"
        intent = "advice"

    security: SecurityTier = "internal"
    if "confidential" in roles or "机密" in q:
        security = "confidential"
    elif "restricted" in roles or "绝密" in q:
        security = "restricted"
    elif "public" in roles:
        security = "public"

    return ClassificationResult(tier, doc_type, intent, security, 0.82)

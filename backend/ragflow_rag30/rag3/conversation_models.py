#
# RAG3 智能对话 — 数据模型（与 PRD §4 对齐）
#
from __future__ import annotations

from typing import Any, TypedDict  # noqa: F401 — metadata_filters uses Any


class ConversationSettings(TypedDict, total=False):
    system_prompt: str
    opener: str
    similarity_threshold: float
    vector_weight: float
    top_k: int
    use_rerank: bool
    rerank_model: str
    channel_graph: bool
    channel_wiki: bool
    channel_pageindex: bool
    temperature: float
    max_tokens: int
    llm_model: str
    show_citations: bool
    show_trace: bool
    streaming: bool
    strategy: str
    metadata_filters: dict[str, Any]


DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
    "system_prompt": (
        "你是企业知识库智能助手。请基于提供的检索片段回答问题，"
        "使用 [n] 标注引用。若知识库无相关内容，请明确说明。"
    ),
    "opener": "您好，我可以帮您查询知识库内容，请直接提问。",
    "similarity_threshold": 0.2,
    "vector_weight": 0.7,
    "top_k": 10,
    "use_rerank": True,
    "rerank_model": "",
    "channel_graph": False,
    "channel_wiki": True,
    "channel_pageindex": True,
    "temperature": 0.3,
    "max_tokens": 2048,
    "llm_model": "",
    "show_citations": True,
    "show_trace": True,
    "streaming": True,
    "strategy": "auto",
}


def merge_settings(raw: dict[str, Any] | None) -> ConversationSettings:
    merged: dict[str, Any] = dict(DEFAULT_CONVERSATION_SETTINGS)
    if isinstance(raw, dict):
        merged.update(raw)
    return merged  # type: ignore[return-value]

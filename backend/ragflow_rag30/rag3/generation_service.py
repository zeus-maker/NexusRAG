#
# RAG3 答案生成 — 检索片段 + LLM
#
from __future__ import annotations

import logging
import re
from typing import Any, AsyncIterator

from api.db.joint_services.tenant_model_service import get_tenant_default_model_by_type
from api.db.services.llm_service import LLMBundle
from common.constants import LLMType
from fusion.rrf_fusion import FusedHit

logger = logging.getLogger(__name__)

_KNOWLEDGE_PROMPT = """以下是从知识库检索到的相关片段，请据此回答用户问题。在答案中用 [n] 标注引用（n 为片段序号）。

{knowledge}

请用 Markdown 格式回答，条理清晰。若片段不足以回答，请说明「知识库中未找到足够信息」。"""


def _build_knowledge_block(hits: list[FusedHit], max_chars: int = 12000) -> tuple[str, list[dict[str, Any]]]:
    citations: list[dict[str, Any]] = []
    parts: list[str] = []
    used = 0
    for i, h in enumerate(hits[:8], start=1):
        page_raw = (h.metadata or {}).get("page", "")
        page_num = 0
        if isinstance(page_raw, (int, float)):
            page_num = int(page_raw)
        elif isinstance(page_raw, str):
            digits = "".join(ch for ch in page_raw if ch.isdigit())
            page_num = int(digits) if digits else 0
        snippet = (h.snippet or "")[:800]
        block = f"[{i}] 文档: {h.doc_name}\n{snippet}\n"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
        citations.append({
            "index": i,
            "chunk_id": h.chunk_id,
            "doc_id": h.doc_id,
            "doc_name": h.doc_name,
            "page_number": page_num,
            "section": snippet[:48],
            "snippet": snippet[:200],
            "relevance_score": round(float(h.wrrf_score or 0), 4),
        })
    return "\n".join(parts), citations


def _resolve_chat_bundle(tenant_id: str, llm_model: str = "") -> LLMBundle:
    if llm_model:
        from api.db.services.tenant_llm_service import TenantLLMService
        cfg = TenantLLMService.get_model_config(tenant_id, LLMType.CHAT, llm_model)
        if cfg:
            return LLMBundle(tenant_id, cfg)
    default_cfg = get_tenant_default_model_by_type(tenant_id, LLMType.CHAT)
    return LLMBundle(tenant_id, default_cfg)


def _build_history(messages: list[dict[str, Any]], context_window: int) -> list[dict[str, str]]:
    history: list[dict[str, str]] = []
    for m in messages[-context_window * 2 :]:
        role = m.get("role")
        content = m.get("content") or ""
        if role in ("user", "assistant") and content:
            history.append({"role": role, "content": content})
    return history


async def generate_answer(
    tenant_id: str,
    query: str,
    hits: list[FusedHit],
    *,
    messages: list[dict[str, Any]] | None = None,
    system_prompt: str = "",
    llm_model: str = "",
    temperature: float = 0.3,
    max_tokens: int = 2048,
    context_window: int = 10,
) -> dict[str, Any]:
    knowledge, citations = _build_knowledge_block(hits)
    if not knowledge.strip():
        return {
            "content": "未在知识库中找到与问题相关的内容。",
            "citations": [],
            "token_usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }

    system = (system_prompt or "").strip() or _KNOWLEDGE_PROMPT.split("{knowledge}")[0].strip()
    system = system + "\n\n" + _KNOWLEDGE_PROMPT.format(knowledge=knowledge)

    history = _build_history(messages or [], context_window)
    history.append({"role": "user", "content": query})

    chat_mdl = _resolve_chat_bundle(tenant_id, llm_model)
    gen_conf = {"temperature": temperature, "max_tokens": max_tokens}
    content, total_tokens = await chat_mdl.async_chat(system, history, gen_conf)

    confidence = round(min(0.99, (hits[0].wrrf_score if hits else 0.5) * 1.05), 2)
    return {
        "content": (content or "").strip(),
        "citations": citations,
        "token_usage": {
            "prompt_tokens": max(0, total_tokens - len(content or "") // 2),
            "completion_tokens": len(content or "") // 2,
            "total_tokens": total_tokens,
        },
        "confidence": {"score": confidence, "level": "high" if confidence >= 0.8 else "medium"},
    }


async def generate_answer_stream(
    tenant_id: str,
    query: str,
    hits: list[FusedHit],
    *,
    messages: list[dict[str, Any]] | None = None,
    system_prompt: str = "",
    llm_model: str = "",
    temperature: float = 0.3,
    max_tokens: int = 2048,
    context_window: int = 10,
) -> AsyncIterator[tuple[str, Any]]:
    """Yield ('token', str) | ('citation', dict) | ('usage', dict)"""
    knowledge, citations = _build_knowledge_block(hits)
    for c in citations:
        yield ("citation", c)

    if not knowledge.strip():
        yield ("token", "未在知识库中找到与问题相关的内容。")
        yield ("usage", {"total_tokens": 0})
        return

    system = (system_prompt or "").strip() or _KNOWLEDGE_PROMPT.split("{knowledge}")[0].strip()
    system = system + "\n\n" + _KNOWLEDGE_PROMPT.format(knowledge=knowledge)
    history = _build_history(messages or [], context_window)
    history.append({"role": "user", "content": query})

    chat_mdl = _resolve_chat_bundle(tenant_id, llm_model)
    gen_conf = {"temperature": temperature, "max_tokens": max_tokens}
    total_tokens = 0
    token_emitted = False
    async for chunk in chat_mdl.async_chat_streamly_delta(system, history, gen_conf):
        if isinstance(chunk, int):
            total_tokens = chunk
            continue
        if chunk:
            token_emitted = True
            yield ("token", chunk)
    if not token_emitted:
        fallback = template_answer(query, hits)
        yield ("token", fallback["content"])
    yield ("usage", {"total_tokens": total_tokens})


def template_answer(query: str, hits: list[FusedHit]) -> dict[str, Any]:
    """无 LLM 时的回退（与旧 rag3_query 兼容）"""
    _, citations = _build_knowledge_block(hits)
    if not hits:
        return {"content": "未在知识库中找到与问题相关的内容。", "citations": []}
    parts = [f"根据知识库检索，与「{query}」相关的内容如下：", ""]
    for i, h in enumerate(hits[:5], start=1):
        parts.append(f"**{i}. {h.doc_name}**")
        parts.append(h.snippet or "")
        parts.append("")
    return {"content": "\n".join(parts).strip(), "citations": citations}

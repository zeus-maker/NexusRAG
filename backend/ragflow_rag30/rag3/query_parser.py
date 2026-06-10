#
# PRD §4.6 高级检索语法解析 — field:value / AND|OR|NOT / 引号短语 / page:N-M
#
from __future__ import annotations

import re
from typing import Any

FIELD_ALIASES: dict[str, str] = {
    "department": "department",
    "部门": "department",
    "type": "type",
    "类型": "type",
    "date": "date",
    "author": "author",
    "作者": "author",
    "page": "page",
    "页码": "page",
}

AUTOCOMPLETE: dict[str, list[str]] = {
    "department": ["法务", "财务", "研发", "采购"],
    "type": ["合同", "政策", "财报", "通知"],
    "author": ["张三", "李四", "王芳"],
}

_FIELD_RE = re.compile(
    r'(?P<field>[a-zA-Z\u4e00-\u9fff]+)\s*:\s*(?:"(?P<quoted>[^"]+)"|(?P<bare>[^\s]+))',
)
_PAGE_RE = re.compile(r'page\s*:\s*(\d+)(?:\s*-\s*(\d+))?', re.I)
_QUOTED_RE = re.compile(r'"([^"]+)"')


def _normalize_field(raw: str) -> str | None:
    key = raw.strip().lower()
    return FIELD_ALIASES.get(key) or FIELD_ALIASES.get(raw.strip())


def parse_advanced_query(text: str) -> dict[str, Any]:
    """返回 free_text、metadata_filters、page_range、phrases、ast、autocomplete_hints。"""
    raw = (text or "").strip()
    if not raw:
        return {
            "original": "",
            "free_text": "",
            "metadata_filters": {"conditions": [], "logical_operator": "and"},
            "page_range": None,
            "phrases": [],
            "ast": [],
            "autocomplete_hints": [],
        }

    working = raw
    conditions: list[dict[str, Any]] = []
    page_range: dict[str, int] | None = None
    ast_nodes: list[dict[str, Any]] = []

    for m in _PAGE_RE.finditer(working):
        start = int(m.group(1))
        end = int(m.group(2) or start)
        page_range = {"start": start, "end": end}
        conditions.append({
            "name": "page",
            "comparison_operator": "between",
            "value": f"{start}-{end}",
        })
        ast_nodes.append({"type": "page_range", "start": start, "end": end})
    working = _PAGE_RE.sub(" ", working)

    for m in _FIELD_RE.finditer(working):
        field = _normalize_field(m.group("field") or "")
        if not field or field == "page":
            continue
        value = (m.group("quoted") or m.group("bare") or "").strip()
        if not value:
            continue
        conditions.append({
            "name": field,
            "comparison_operator": "is",
            "value": value,
        })
        ast_nodes.append({"type": "field", "field": field, "value": value})
    working = _FIELD_RE.sub(" ", working)

    phrases = [p.strip() for p in _QUOTED_RE.findall(raw) if p.strip()]
    for p in phrases:
        ast_nodes.append({"type": "phrase", "value": p})
    working = _QUOTED_RE.sub(" ", working)

    bool_ops = re.findall(r'\b(AND|OR|NOT)\b', working, flags=re.I)
    for op in bool_ops:
        ast_nodes.append({"type": "bool", "op": op.upper()})

    free_text = re.sub(r'\b(AND|OR|NOT)\b', " ", working, flags=re.I)
    free_text = re.sub(r'\s+', " ", free_text).strip()

    hints: list[dict[str, str]] = []
    partial = re.search(r'([a-zA-Z\u4e00-\u9fff]+)\s*:\s*([^\s"]*)$', raw)
    if partial:
        field = _normalize_field(partial.group(1))
        prefix = partial.group(2)
        if field and field in AUTOCOMPLETE:
            for v in AUTOCOMPLETE[field]:
                if not prefix or v.startswith(prefix):
                    hints.append({"field": field, "value": v})

    return {
        "original": raw,
        "free_text": free_text or raw,
        "metadata_filters": {
            "conditions": conditions,
            "logical_operator": "and",
        },
        "page_range": page_range,
        "phrases": phrases,
        "ast": ast_nodes,
        "autocomplete_hints": hints[:8],
    }

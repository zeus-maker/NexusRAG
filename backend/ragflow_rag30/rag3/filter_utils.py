#
# 检索结果元数据过滤（配合 query_parser metadata_filters）
#
from __future__ import annotations

import re
from typing import Any

from fusion.rrf_fusion import FusedHit
from pipelines.base_pipeline import PipelineHit


def _text_blob(hit: PipelineHit | FusedHit) -> str:
    meta = hit.metadata or {}
    parts = [
        str(hit.doc_name or ""),
        str(hit.snippet or ""),
        str(meta.get("department") or ""),
        str(meta.get("type") or ""),
        str(meta.get("author") or ""),
    ]
    return " ".join(parts).lower()


def _match_condition(hit: PipelineHit | FusedHit, cond: dict[str, Any]) -> bool:
    name = str(cond.get("name") or "").lower()
    op = str(cond.get("comparison_operator") or "is").lower()
    value = str(cond.get("value") or "").lower()
    meta = hit.metadata or {}

    if name == "page":
        page = int(meta.get("page") or 0)
        if op == "between" and "-" in value:
            a, b = value.split("-", 1)
            try:
                return int(a) <= page <= int(b)
            except ValueError:
                return True
        try:
            return page == int(value)
        except ValueError:
            return True

    field_val = str(meta.get(name) or "").lower()
    if field_val:
        if op in ("is", "contains"):
            return value in field_val or field_val == value
        if op == "not":
            return value not in field_val
        return value in field_val

    # 无结构化元数据时回退到全文匹配
    blob = _text_blob(hit)
    if op == "not":
        return value not in blob
    return value in blob


def apply_metadata_filters(
    hits: list[PipelineHit] | list[FusedHit],
    metadata_filters: dict[str, Any] | None,
) -> list:
    if not hits or not metadata_filters:
        return hits
    conditions = metadata_filters.get("conditions") or []
    if not conditions:
        return hits
    logic = str(metadata_filters.get("logical_operator") or "and").lower()
    out = []
    for hit in hits:
        checks = [_match_condition(hit, c) for c in conditions]
        ok = all(checks) if logic == "and" else any(checks)
        if ok:
            out.append(hit)
    return out

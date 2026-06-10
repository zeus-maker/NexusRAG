"""块级 ACL 过滤（技术方案 §37 / PRD US-1.16）"""
from __future__ import annotations

from fusion.rrf_fusion import FusedHit
from pipelines.base_pipeline import PipelineHit

ACL_LEVEL_ORDER: dict[str, int] = {
    "public": 0,
    "internal": 1,
    "confidential": 2,
    "restricted": 3,
}

# 角色 → 最高可访问密级
ROLE_CLEARANCE: dict[str, int] = {
    "admin": 3,
    "owner": 3,
    "legal": 2,
    "confidential": 2,
    "finance": 1,
    "hr": 1,
    "default": 1,
}


def user_clearance_level(user_roles: list[str] | None) -> int:
    level = ROLE_CLEARANCE["default"]
    for role in user_roles or []:
        key = str(role).strip().lower()
        level = max(level, ROLE_CLEARANCE.get(key, ROLE_CLEARANCE["default"]))
    return level


def _chunk_required_level(hit_metadata: dict | None) -> int:
    if not hit_metadata:
        return ACL_LEVEL_ORDER["internal"]
    raw = hit_metadata.get("acl_level") or hit_metadata.get("security_level") or "internal"
    return ACL_LEVEL_ORDER.get(str(raw).lower(), ACL_LEVEL_ORDER["internal"])


def filter_hits_by_acl(hits: list[PipelineHit], user_roles: list[str] | None) -> list[PipelineHit]:
    clearance = user_clearance_level(user_roles)
    out: list[PipelineHit] = []
    for hit in hits:
        required = _chunk_required_level(hit.metadata)
        if clearance >= required:
            out.append(hit)
    return out


def filter_fused_hits_by_acl(hits: list[FusedHit], user_roles: list[str] | None) -> list[FusedHit]:
    clearance = user_clearance_level(user_roles)
    out: list[FusedHit] = []
    for hit in hits:
        required = _chunk_required_level(hit.metadata)
        if clearance >= required:
            out.append(hit)
    return out

"""块级 ACL 过滤（技术方案 §37）— 首版透传，后续接 RAGFlow 权限元数据"""
from __future__ import annotations

from pipelines.base_pipeline import PipelineHit


def filter_hits_by_acl(hits: list[PipelineHit], user_roles: list[str] | None) -> list[PipelineHit]:
    # TODO: 读取 chunk.acl_level 与用户角色矩阵
    return hits

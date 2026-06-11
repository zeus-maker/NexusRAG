#
# 租户级 RAG3 系统配置读写
#
from __future__ import annotations

import copy
import logging
import time
from typing import Any

from api.db.db_models import TenantRag3Config
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp
from rag3.system_config_defaults import CONFIG_DEFAULTS, VALID_CONFIG_KEYS

logger = logging.getLogger(__name__)

_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_TTL = 60.0


def _cache_key(tenant_id: str, config_key: str) -> str:
    return f"{tenant_id}:{config_key}"


def _default_for(key: str) -> dict | list:
    val = CONFIG_DEFAULTS.get(key)
    return copy.deepcopy(val) if val is not None else {}


def get_config(tenant_id: str, config_key: str) -> dict | list:
    if config_key not in VALID_CONFIG_KEYS:
        raise ValueError(f"unknown config_key: {config_key}")
    ck = _cache_key(tenant_id, config_key)
    cached = _CACHE.get(ck)
    if cached and (time.time() - cached[0]) < _CACHE_TTL:
        return copy.deepcopy(cached[1])
    try:
        row = TenantRag3Config.get_or_none(
            (TenantRag3Config.tenant_id == tenant_id) & (TenantRag3Config.config_key == config_key)
        )
    except Exception as e:
        logger.warning("get_config db error key=%s: %s", config_key, e)
        row = None
    if row and row.config_json is not None:
        data = copy.deepcopy(row.config_json)
    else:
        data = _default_for(config_key)
    _CACHE[ck] = (time.time(), copy.deepcopy(data))
    return data


def set_config(tenant_id: str, config_key: str, payload: dict | list, *, user_id: str | None = None) -> dict | list:
    if config_key not in VALID_CONFIG_KEYS:
        raise ValueError(f"unknown config_key: {config_key}")
    now = current_timestamp()
    try:
        row = TenantRag3Config.get_or_none(
            (TenantRag3Config.tenant_id == tenant_id) & (TenantRag3Config.config_key == config_key)
        )
        version = 1
        if row:
            version = int(row.version or 0) + 1
            TenantRag3Config.update(
                config_json=payload,
                version=version,
                updated_by=user_id,
                update_time=now,
            ).where(TenantRag3Config.id == row.id).execute()
        else:
            TenantRag3Config.create(
                id=get_uuid(),
                tenant_id=tenant_id,
                config_key=config_key,
                config_json=payload,
                version=version,
                updated_by=user_id,
                create_time=now,
                update_time=now,
            )
    except Exception as e:
        logger.exception("set_config failed key=%s", config_key)
        raise
    ck = _cache_key(tenant_id, config_key)
    _CACHE[ck] = (time.time(), copy.deepcopy(payload))
    try:
        from rag3.audit_service import log_audit_event
        log_audit_event(
            tenant_id=tenant_id,
            user_id=user_id or tenant_id,
            event_type="config_change",
            resource_type="system_config",
            resource_id=config_key,
            details={"config_key": config_key, "version": version},
        )
    except Exception:
        pass
    return copy.deepcopy(payload)


def invalidate_cache(tenant_id: str | None = None) -> None:
    if tenant_id is None:
        _CACHE.clear()
        return
    keys = [k for k in _CACHE if k.startswith(f"{tenant_id}:")]
    for k in keys:
        _CACHE.pop(k, None)


def get_fusion_runtime(tenant_id: str) -> dict[str, Any]:
    cfg = get_config(tenant_id, "fusion")
    if not isinstance(cfg, dict):
        return {"rrfK": 60, "rerankTopN": 5, "channel_weights": None}
    weights = {}
    for cw in cfg.get("channelWeights") or []:
        if isinstance(cw, dict) and cw.get("channel"):
            ch = str(cw["channel"])
            map_key = "graph" if ch in ("graphrag", "graphrag_local") else ch
            weights[map_key] = float(cw.get("weight") or 1.0)
    return {
        "rrfK": int(cfg.get("rrfK") or 60),
        "rerankTopN": int(cfg.get("rerankTopN") or 5),
        "rerankModel": (cfg.get("rerankModel") or "").strip() or None,
        "channel_weights": weights or None,
    }

#
# RAG3 系统管理 API — /api/v1/admin/*
#
from __future__ import annotations

import copy
import logging

from quart import request

from api.apps import current_user, login_required
from api.db import UserTenantRole
from api.db.db_models import Knowledgebase, UserTenant
from api.db.services.user_service import UserService, UserTenantService
from api.utils.api_utils import get_data_error_result, get_json_result, get_request_json, server_error_response, validate_request
from common.constants import StatusEnum
from common.misc_utils import get_uuid, thread_pool_exec
from common.time_utils import current_timestamp
from rag3.admin_job_service import create_job, get_job, list_jobs
from rag3.audit_service import list_audit_logs
from rag3.monitor_service import get_admin_health, get_monitor_dashboard, get_usage_stats
from rag3.system_config_defaults import CONFIG_DEFAULTS, PIPELINE_DEFINITIONS
from rag3.system_config_service import get_config, set_config
from rag3.trace_service import get_trace_detail, list_traces
from router import RouterEngine

logger = logging.getLogger(__name__)
_engine = RouterEngine()

_PIPELINE_LABEL = {
    "vector": "P1 向量",
    "pageindex": "P2 PageIndex",
    "graphrag": "P3 GraphRAG",
    "wiki": "P4 Wiki",
    "agent": "P5 Agent",
}


def _tenant_id() -> str:
    return current_user.id


def _enrich_pipeline_config(tenant_id: str, cfg: dict) -> dict:
    out = copy.deepcopy(cfg)
    defs = out.get("definitions") or PIPELINE_DEFINITIONS
    total_docs = 0
    indexed_docs = 0
    try:
        kbs = list(Knowledgebase.select().where(Knowledgebase.tenant_id == tenant_id))
        for kb in kbs:
            total_docs += int(kb.doc_num or 0)
            indexed_docs += int(kb.doc_num or 0)
    except Exception as e:
        logger.warning("pipeline kb stats failed: %s", e)
    enriched = []
    for d in defs:
        item = copy.deepcopy(d)
        item["indexed"] = indexed_docs
        item["total"] = max(total_docs, item.get("total") or 0)
        enriched.append(item)
    out["definitions"] = enriched
    return out


def _user_to_api(row: dict) -> dict:
    role_map = {"admin": "平台管理员", "owner": "平台管理员", "normal": "普通用户", "invite": "普通用户"}
    status = "active" if row.get("status") == "1" else "disabled"
    return {
        "user_id": row.get("user_id") or row.get("id"),
        "display_name": row.get("nickname") or row.get("email") or "",
        "email": row.get("email") or "",
        "department": "",
        "role": role_map.get(str(row.get("role") or ""), str(row.get("role") or "普通用户")),
        "status": status,
        "last_login": str(row.get("update_date") or ""),
    }


def _classify_preview(query: str, user_roles: list | None = None, kb_id: str | None = None) -> dict:
    plan = _engine.plan(query, user_roles, kb_id)
    clf = plan.classification
    dec = plan.decision
    primary = [_PIPELINE_LABEL.get(dec.primary, dec.primary)]
    secondary = [_PIPELINE_LABEL.get(p, p) for p in dec.auxiliary]
    fusion = "cascade" if not dec.use_fusion else "rrf"
    return {
        "query": query,
        "tier": clf.query_tier,
        "docType": clf.doc_type,
        "intent": clf.user_intent,
        "security": clf.security_tier,
        "primary": primary,
        "secondary": secondary,
        "fusion": fusion,
        "confidence": float(clf.confidence or 0.85),
        "estLatencyMs": 450,
        "classification": {
            "query_tier": clf.query_tier,
            "doc_type": clf.doc_type,
            "user_intent": clf.user_intent,
            "security_tier": clf.security_tier,
            "confidence": clf.confidence,
        },
        "pipeline_ids": plan.pipeline_ids,
    }


# ── 健康 / 监控 ──


@manager.route("/admin/health", methods=["GET"])  # noqa: F821
@login_required
def admin_health():
    try:
        return get_json_result(data=get_admin_health())
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/usage-stats", methods=["GET"])  # noqa: F821
@login_required
def admin_usage_stats():
    try:
        return get_json_result(data=get_usage_stats(_tenant_id()))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/monitor", methods=["GET"])  # noqa: F821
@login_required
def admin_monitor():
    try:
        return get_json_result(data=get_monitor_dashboard(_tenant_id()))
    except Exception as e:
        return server_error_response(e)


# ── 用户 / 角色 ──


@manager.route("/admin/users", methods=["GET"])  # noqa: F821
@login_required
def admin_list_users():
    try:
        tid = _tenant_id()
        users = UserTenantService.get_by_tenant_id(tid)
        return get_json_result(data=[_user_to_api(u) for u in users])
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/users", methods=["POST"])  # noqa: F821
@login_required
@validate_request("email")
async def admin_invite_user():
    try:
        tid = _tenant_id()
        body = await get_request_json()
        email = body["email"].strip()
        invite_users = UserService.query(email=email)
        if not invite_users:
            return get_data_error_result(message="User not found.")
        user_id_to_invite = invite_users[0].id
        if UserTenantService.query(user_id=user_id_to_invite, tenant_id=tid):
            return get_data_error_result(message=f"{email} is already in the team.")
        UserTenantService.save(
            id=get_uuid(),
            user_id=user_id_to_invite,
            tenant_id=tid,
            invited_by=current_user.id,
            role=UserTenantRole.INVITE,
            status=StatusEnum.VALID.value,
        )
        return get_json_result(data=_user_to_api({"user_id": user_id_to_invite, "email": email, "nickname": invite_users[0].nickname, "status": "1", "role": "invite"}))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/users", methods=["DELETE"])  # noqa: F821
@login_required
@validate_request("user_id")
async def admin_remove_user():
    try:
        tid = _tenant_id()
        body = await get_request_json()
        user_id = body["user_id"]
        UserTenantService.filter_delete([UserTenant.tenant_id == tid, UserTenant.user_id == user_id])
        return get_json_result(data={"deleted": True})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/roles", methods=["GET"])  # noqa: F821
@login_required
def admin_get_roles():
    try:
        cfg = get_config(_tenant_id(), "roles")
        items = cfg.get("items") if isinstance(cfg, dict) else cfg
        return get_json_result(data={"items": items or []})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/roles", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_roles():
    try:
        body = await get_request_json()
        payload = {"items": body.get("items") or body}
        saved = set_config(_tenant_id(), "roles", payload, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


# ── 审计 / 追踪 ──


@manager.route("/admin/audit-logs", methods=["GET"])  # noqa: F821
@login_required
def admin_audit_logs():
    try:
        search = request.args.get("search") or ""
        event_type = request.args.get("event_type") or ""
        page = int(request.args.get("page") or 1)
        page_size = int(request.args.get("page_size") or 50)
        data = list_audit_logs(_tenant_id(), search=search, event_type=event_type, page=page, page_size=page_size)
        return get_json_result(data=data)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/traces", methods=["GET"])  # noqa: F821
@login_required
def admin_traces():
    try:
        search = request.args.get("search") or ""
        page = int(request.args.get("page") or 1)
        page_size = int(request.args.get("page_size") or 20)
        data = list_traces(_tenant_id(), search=search, page=page, page_size=page_size)
        return get_json_result(data=data)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/traces/<trace_id>", methods=["GET"])  # noqa: F821
@login_required
def admin_trace_detail(trace_id):
    try:
        detail = get_trace_detail(_tenant_id(), trace_id)
        if not detail:
            return get_data_error_result(message="trace not found")
        return get_json_result(data=detail)
    except Exception as e:
        return server_error_response(e)


# ── 流水线 / 分类 / 融合 / 策略 ──


@manager.route("/admin/pipeline-configs", methods=["GET"])  # noqa: F821
@login_required
def admin_get_pipeline():
    try:
        cfg = get_config(_tenant_id(), "pipeline")
        return get_json_result(data=_enrich_pipeline_config(_tenant_id(), cfg if isinstance(cfg, dict) else {}))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/pipeline-configs", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_pipeline():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "pipeline", body, user_id=_tenant_id())
        return get_json_result(data=_enrich_pipeline_config(_tenant_id(), saved if isinstance(saved, dict) else {}))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/classifier-config", methods=["GET"])  # noqa: F821
@login_required
def admin_get_classifier():
    try:
        return get_json_result(data=get_config(_tenant_id(), "classifier_config"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/classifier-config", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_classifier():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "classifier_config", body, user_id=_tenant_id())
        routing = body.get("routingMatrix") or body.get("routing_rules")
        if routing:
            set_config(_tenant_id(), "routing_rules", {"rules": routing}, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/classifier/preview", methods=["POST"])  # noqa: F821
@login_required
async def admin_classifier_preview():
    try:
        body = await get_request_json()
        query = (body.get("query") or "").strip()
        if not query:
            return get_data_error_result(message="query is required")
        roles = body.get("user_roles") or []
        kb_id = body.get("kb_id")
        data = await thread_pool_exec(_classify_preview, query, roles, kb_id)
        return get_json_result(data=data)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/fusion-config", methods=["GET"])  # noqa: F821
@login_required
def admin_get_fusion():
    try:
        return get_json_result(data=get_config(_tenant_id(), "fusion"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/fusion-config", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_fusion():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "fusion", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/retrieval-strategy", methods=["GET"])  # noqa: F821
@login_required
def admin_get_retrieval():
    try:
        return get_json_result(data=get_config(_tenant_id(), "retrieval_strategy"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/retrieval-strategy", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_retrieval():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "retrieval_strategy", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/generation-strategy", methods=["GET"])  # noqa: F821
@login_required
def admin_get_generation():
    try:
        return get_json_result(data=get_config(_tenant_id(), "generation_strategy"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/generation-strategy", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_generation():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "generation_strategy", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


# ── Prompt / 灰度 / 备份 / 向量 / 安全 ──


@manager.route("/admin/prompt-templates", methods=["GET"])  # noqa: F821
@login_required
def admin_get_prompts():
    try:
        cfg = get_config(_tenant_id(), "prompt_templates")
        items = cfg.get("items") if isinstance(cfg, dict) else cfg
        return get_json_result(data={"items": items or []})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/prompt-templates", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_prompts():
    try:
        body = await get_request_json()
        payload = {"items": body.get("items") or body}
        saved = set_config(_tenant_id(), "prompt_templates", payload, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/prompt-templates", methods=["POST"])  # noqa: F821
@login_required
async def admin_create_prompt():
    try:
        body = await get_request_json()
        cfg = get_config(_tenant_id(), "prompt_templates")
        items = list((cfg.get("items") if isinstance(cfg, dict) else cfg) or [])
        item = {
            "id": body.get("id") or get_uuid(),
            "name": body.get("name") or "新模板",
            "scene": body.get("scene") or "chat",
            "version": body.get("version") or "v1.0",
            "uses": 0,
            "status": body.get("status") or "draft",
            "updated": str(current_timestamp()),
            "body": body.get("body") or "",
        }
        items.append(item)
        saved = set_config(_tenant_id(), "prompt_templates", {"items": items}, user_id=_tenant_id())
        return get_json_result(data=item)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/prompt-templates/<template_id>/test", methods=["POST"])  # noqa: F821
@login_required
async def admin_test_prompt(template_id):
    try:
        body = await get_request_json()
        text = body.get("body") or body.get("prompt") or ""
        variables = body.get("variables") or {}
        for k, v in variables.items():
            text = text.replace(f"{{{{{k}}}}}", str(v))
        return get_json_result(data={"output": text, "valid": True})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/gray-releases", methods=["GET"])  # noqa: F821
@login_required
def admin_get_gray():
    try:
        cfg = get_config(_tenant_id(), "gray_releases")
        items = cfg.get("items") if isinstance(cfg, dict) else cfg
        return get_json_result(data={"items": items or []})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/gray-releases", methods=["POST"])  # noqa: F821
@login_required
async def admin_create_gray():
    try:
        body = await get_request_json()
        cfg = get_config(_tenant_id(), "gray_releases")
        items = list((cfg.get("items") if isinstance(cfg, dict) else cfg) or [])
        item = {**body, "id": body.get("id") or get_uuid(), "status": body.get("status") or "draft"}
        items.append(item)
        set_config(_tenant_id(), "gray_releases", {"items": items}, user_id=_tenant_id())
        return get_json_result(data=item)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/gray-releases/<release_id>/publish", methods=["POST"])  # noqa: F821
@login_required
async def admin_publish_gray(release_id):
    try:
        job = create_job(_tenant_id(), "gray_publish", {"release_id": release_id}, created_by=_tenant_id())
        return get_json_result(data={"job": job})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/gray-releases/<release_id>/rollback", methods=["POST"])  # noqa: F821
@login_required
async def admin_rollback_gray(release_id):
    try:
        job = create_job(_tenant_id(), "gray_rollback", {"release_id": release_id}, created_by=_tenant_id())
        return get_json_result(data={"job": job})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/backup-policy", methods=["GET"])  # noqa: F821
@login_required
def admin_get_backup_policy():
    try:
        return get_json_result(data=get_config(_tenant_id(), "backup_policy"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/backup-policy", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_backup_policy():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "backup_policy", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/backups", methods=["GET"])  # noqa: F821
@login_required
def admin_list_backups():
    try:
        jobs = list_jobs(_tenant_id(), job_type="backup")
        return get_json_result(data={"items": jobs})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/maintenance/backup", methods=["POST"])  # noqa: F821
@login_required
async def admin_trigger_backup():
    try:
        body = await get_request_json() if request.is_json else {}
        job = create_job(_tenant_id(), "backup", body or {}, created_by=_tenant_id())
        return get_json_result(data={"job": job})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/vector-db", methods=["GET"])  # noqa: F821
@login_required
def admin_get_vector_db():
    try:
        return get_json_result(data=get_config(_tenant_id(), "vector_db"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/vector-db", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_vector_db():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "vector_db", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/vector-db/migrate", methods=["POST"])  # noqa: F821
@login_required
async def admin_migrate_vector_db():
    try:
        body = await get_request_json() if request.is_json else {}
        job = create_job(_tenant_id(), "vector_migrate", body or {}, created_by=_tenant_id())
        return get_json_result(data={"job": job})
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/security/rules", methods=["GET"])  # noqa: F821
@login_required
def admin_get_security():
    try:
        return get_json_result(data=get_config(_tenant_id(), "security_rules"))
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/security/rules", methods=["PUT"])  # noqa: F821
@login_required
async def admin_put_security():
    try:
        body = await get_request_json()
        saved = set_config(_tenant_id(), "security_rules", body, user_id=_tenant_id())
        return get_json_result(data=saved)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/security/acl-simulate", methods=["POST"])  # noqa: F821
@login_required
async def admin_acl_simulate():
    try:
        body = await get_request_json()
        query = body.get("query") or ""
        user = body.get("user") or body.get("user_name") or ""
        allowed = bool(query and user)
        return get_json_result(data={
            "allowed": allowed,
            "reason": "模拟通过：用户有权访问该资源" if allowed else "缺少 query 或 user",
        })
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/jobs/<job_id>", methods=["GET"])  # noqa: F821
@login_required
def admin_get_job(job_id):
    try:
        job = get_job(_tenant_id(), job_id)
        if not job:
            return get_data_error_result(message="job not found")
        return get_json_result(data=job)
    except Exception as e:
        return server_error_response(e)


@manager.route("/admin/config/defaults", methods=["GET"])  # noqa: F821
@login_required
def admin_config_defaults():
    try:
        return get_json_result(data={k: copy.deepcopy(v) for k, v in CONFIG_DEFAULTS.items()})
    except Exception as e:
        return server_error_response(e)

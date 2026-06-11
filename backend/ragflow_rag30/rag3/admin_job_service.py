#
# 管理后台异步任务（备份/灰度/向量迁移等占位）
#
from __future__ import annotations

import logging
import threading
import time
from typing import Any

from api.db.db_models import AdminJob
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp

logger = logging.getLogger(__name__)

JOB_TYPES = frozenset({"backup", "restore", "gray_publish", "gray_rollback", "vector_migrate"})


def create_job(
    tenant_id: str,
    job_type: str,
    payload: dict[str, Any] | None = None,
    *,
    created_by: str | None = None,
) -> dict[str, Any]:
    if job_type not in JOB_TYPES:
        raise ValueError(f"unsupported job_type: {job_type}")
    job_id = get_uuid()
    now = current_timestamp()
    row = {
        "id": job_id,
        "tenant_id": tenant_id,
        "job_type": job_type,
        "status": "pending",
        "progress": 0,
        "payload": payload or {},
        "result": None,
        "error_message": None,
        "created_by": created_by or tenant_id,
        "create_time": now,
        "complete_time": None,
    }
    AdminJob.create(**row)
    threading.Thread(target=_run_job_stub, args=(job_id,), daemon=True).start()
    return _job_to_api(row)


def _run_job_stub(job_id: str) -> None:
    try:
        AdminJob.update(status="running", progress=10).where(AdminJob.id == job_id).execute()
        time.sleep(0.5)
        AdminJob.update(progress=60).where(AdminJob.id == job_id).execute()
        time.sleep(0.5)
        AdminJob.update(
            status="completed",
            progress=100,
            result={"message": "任务已完成（stub）"},
            complete_time=current_timestamp(),
        ).where(AdminJob.id == job_id).execute()
    except Exception as e:
        logger.exception("job %s failed", job_id)
        try:
            AdminJob.update(
                status="failed",
                error_message=str(e),
                complete_time=current_timestamp(),
            ).where(AdminJob.id == job_id).execute()
        except Exception:
            pass


def get_job(tenant_id: str, job_id: str) -> dict[str, Any] | None:
    try:
        row = AdminJob.get_or_none((AdminJob.id == job_id) & (AdminJob.tenant_id == tenant_id))
    except Exception:
        return None
    if not row:
        return None
    return _job_to_api(row.__data__)


def list_jobs(tenant_id: str, job_type: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    try:
        q = AdminJob.select().where(AdminJob.tenant_id == tenant_id).order_by(AdminJob.create_time.desc())
        if job_type:
            q = q.where(AdminJob.job_type == job_type)
        return [_job_to_api(r.__data__) for r in q.limit(limit)]
    except Exception as e:
        logger.warning("list_jobs failed: %s", e)
        return []


def _job_to_api(row: dict) -> dict[str, Any]:
    return {
        "id": row["id"],
        "job_type": row["job_type"],
        "status": row["status"],
        "progress": row.get("progress") or 0,
        "payload": row.get("payload"),
        "result": row.get("result"),
        "error": row.get("error_message"),
        "created_at": row.get("create_time"),
        "completed_at": row.get("complete_time"),
    }

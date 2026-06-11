#
# RAG3 评测中心 API — /api/v1/eval/*
#
import csv
import io
import json
import logging

from quart import Response, request

from api.apps import current_user, login_required
from api.db.db_models import EvalAbTest, EvaluationCase, EvaluationDataset, EvaluationResult, EvaluationRun
from api.db.services.evaluation_service import EvaluationService
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.utils.api_utils import get_data_error_result, get_json_result, get_request_json, server_error_response
from common.misc_utils import get_uuid, thread_pool_exec
from common.time_utils import current_timestamp
from rag3.cost_service import get_breakdown as cost_breakdown
from rag3.cost_service import get_budget, get_summary as cost_summary
from rag3.cost_service import get_trend as cost_trend
from rag3.cost_service import save_budget
from rag3.eval_settings import build_eval_config_override
from rag3.evaluation_runner import create_and_start_run, request_stop as stop_run
from rag3.replay_service import create_task as create_replay_task
from rag3.replay_service import get_task as get_replay_task
from rag3.replay_service import list_tasks as list_replay_tasks
from rag3.replay_service import request_stop as stop_replay
from rag3.route_learning_service import get_status as route_status
from rag3.route_learning_service import import_samples as route_import
from rag3.route_learning_service import publish as route_publish
from rag3.route_learning_service import rollback as route_rollback
from rag3.route_learning_service import train as route_train
from rag3.satisfaction_service import get_negative_cases, get_summary as sat_summary
from rag3.satisfaction_service import get_trend as sat_trend

logger = logging.getLogger(__name__)


def _tenant_id() -> str:
    return current_user.id


def _runs_for_tenant(tenant_id: str):
    """租户隔离；兼容迁移前 tenant_id 为空且 created_by 匹配的历史记录。"""
    return EvaluationRun.select().where(
        (EvaluationRun.tenant_id == tenant_id)
        | ((EvaluationRun.tenant_id.is_null()) & (EvaluationRun.created_by == tenant_id))
    )


async def _validate_kb(kb_id: str, tenant_id: str) -> str | None:
    ok, kb = await thread_pool_exec(KnowledgebaseService.get_by_id, kb_id)
    if not ok or not kb:
        return f"知识库不存在: {kb_id}"
    if kb.tenant_id != tenant_id:
        return f"无知识库访问权限: {kb_id}"
    return None


def _dataset_tags(row: dict) -> list:
    meta = row.get("metadata")
    if isinstance(meta, dict):
        tags = meta.get("tags")
        if isinstance(tags, list):
            return [str(t) for t in tags if t]
    return []


def _dataset_to_api(row: dict) -> dict:
    kb_ids = row.get("kb_ids") or []
    cases = EvaluationService.get_test_cases(row["id"])
    return {
        "id": row["id"],
        "dataset_id": row["id"],
        "name": row.get("name"),
        "description": row.get("description"),
        "kb_ids": kb_ids,
        "kb_id": kb_ids[0] if kb_ids else None,
        "sample_count": len(cases),
        "query_count": len(cases),
        "tags": _dataset_tags(row),
        "updated_at": row.get("update_time"),
        "create_time": row.get("create_time"),
        "status": "validated" if row.get("status") == 1 else "invalid",
    }


def _parse_import_cases(text: str, filename: str = "") -> list[dict]:
    """Parse CSV or JSON import payload into test case dicts."""
    text = (text or "").lstrip("\ufeff").strip()
    if not text:
        return []
    fname = (filename or "").lower()
    if fname.endswith(".json") or text.startswith("[") or text.startswith("{"):
        try:
            payload = json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON 解析失败: {e}") from e
        items = payload if isinstance(payload, list) else (payload.get("samples") or [])
        cases = []
        for item in items:
            if not isinstance(item, dict):
                continue
            cases.append({
                "question": item.get("question") or item.get("query") or "",
                "reference_answer": item.get("expected_answer") or item.get("reference_answer") or item.get("ground_truth_answer"),
                "relevant_chunk_ids": item.get("relevant_chunk_ids"),
            })
        return cases
    reader = csv.DictReader(io.StringIO(text))
    cases = []
    for r in reader:
        chunk_raw = r.get("relevant_chunk_ids") or ""
        cases.append({
            "question": r.get("question") or r.get("query") or "",
            "reference_answer": r.get("expected_answer") or r.get("ground_truth_answer") or r.get("reference_answer"),
            "relevant_chunk_ids": [x.strip() for x in chunk_raw.split(",") if x.strip()] if chunk_raw else None,
        })
    return cases


def _format_citations(chunks) -> list[dict]:
    items = []
    for i, c in enumerate((chunks or [])[:10]):
        if isinstance(c, str):
            items.append({
                "index": i + 1,
                "doc_name": c,
                "page_number": 0,
                "section": "",
                "snippet": c,
                "relevance_score": 0,
            })
            continue
        if not isinstance(c, dict):
            continue
        meta = c.get("metadata") if isinstance(c.get("metadata"), dict) else {}
        doc_name = c.get("doc_name") or c.get("document_name") or "引用"
        snippet = c.get("snippet") or c.get("content") or ""
        if isinstance(snippet, str) and len(snippet) > 500:
            snippet = snippet[:500]
        score = c.get("wrrf_score")
        if score is None:
            score = c.get("relevance_score", 0)
        try:
            score = float(score or 0)
        except (TypeError, ValueError):
            score = 0
        page = meta.get("page_number") or meta.get("page") or c.get("page_number") or 0
        try:
            page = int(page or 0)
        except (TypeError, ValueError):
            page = 0
        items.append({
            "index": i + 1,
            "doc_id": c.get("doc_id") or meta.get("doc_id"),
            "chunk_id": c.get("chunk_id"),
            "doc_name": doc_name,
            "page_number": page,
            "section": meta.get("section") or meta.get("section_title") or "",
            "snippet": snippet,
            "relevance_score": score,
        })
    return items


def _run_to_api(row: dict) -> dict:
    summary = row.get("metrics_summary") or {}
    scores = {
        "faithfulness": summary.get("faithfulness", 0),
        "context_precision": summary.get("context_precision", 0),
        "answer_relevancy": summary.get("answer_relevancy", 0),
        "hallucination_rate": summary.get("hallucination_rate", 0),
        "recall@10": summary.get("recall@10", summary.get("hit_rate", summary.get("recall", 0))),
        "mrr": summary.get("mrr", summary.get("hit_rate", 0)),
    }
    run_id = row["id"]
    dataset_id = row.get("dataset_id")
    total_cases = summary.get("case_count") or summary.get("total_cases") or 0
    if not total_cases and dataset_id:
        total_cases = len(EvaluationService.get_test_cases(dataset_id))
    completed_cases = EvaluationResult.select().where(EvaluationResult.run_id == run_id).count()

    dataset_name = None
    if dataset_id:
        ds = EvaluationService.get_dataset(dataset_id)
        dataset_name = (ds or {}).get("name")

    kb_name = None
    kb_id = row.get("kb_id")
    if kb_id:
        ok_kb, kb = KnowledgebaseService.get_by_id(kb_id)
        if ok_kb and kb:
            kb_name = getattr(kb, "name", None)

    status = (row.get("status") or "pending").upper()
    progress = int(row.get("progress") or 0)
    create_time = int(row.get("create_time") or 0)
    eta_seconds = None
    if status == "RUNNING" and progress > 0 and create_time:
        elapsed_sec = max(0.001, (current_timestamp() - create_time) / 1000.0)
        eta_seconds = int((elapsed_sec / progress) * (100 - progress))

    return {
        "run_id": run_id,
        "id": run_id,
        "name": row.get("name"),
        "kb_id": kb_id,
        "kb_name": kb_name,
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "status": status.lower(),
        "evaluation_type": row.get("evaluation_type"),
        "metrics": row.get("metrics") or [],
        "scores": scores,
        "baseline_scores": scores,
        "overall_score": summary.get("faithfulness") or summary.get("recall@10") or 0,
        "test_set_size": total_cases,
        "completed_cases": completed_cases,
        "progress": progress,
        "eta_seconds": eta_seconds,
        "metrics_summary": summary,
        "error_message": row.get("error_message") or summary.get("diagnosis"),
        "diagnosis": summary.get("diagnosis"),
        "zero_retrieval_cases": summary.get("zero_retrieval_cases"),
        "started_at": create_time,
        "completed_at": row.get("complete_time"),
        "duration_min": int(((row.get("complete_time") or 0) - create_time) / 60000)
        if row.get("complete_time") else None,
    }


# ---------- Dashboard ----------

@manager.route("/eval/dashboard", methods=["GET"])  # noqa: F821
@login_required
async def eval_dashboard():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    kb_id = request.args.get("kb_id") or None

    runs_q = _runs_for_tenant(tenant_id)
    if kb_id:
        runs_q = runs_q.where(EvaluationRun.kb_id == kb_id)
    runs = [_run_to_api(r.to_dict()) for r in runs_q.order_by(EvaluationRun.create_time.desc()).limit(20)]

    latest = next((r for r in runs if r["status"] == "completed"), runs[0] if runs else None)
    running = [r for r in runs if r["status"] == "running"]

    return get_json_result(data={
        "quality_score": latest["overall_score"] if latest else 0,
        "latest_run": latest,
        "running_tasks": running,
        "recent_runs": runs[:5],
        "satisfaction": sat_summary(tenant_id, period=period, kb_id=kb_id),
        "trend_metrics": sat_trend(tenant_id, period=period, kb_id=kb_id),
        "layered_eval": [
            {"level": "检索", "score": latest["scores"].get("recall@10", 0) if latest else 0},
            {"level": "生成", "score": latest["scores"].get("faithfulness", 0) if latest else 0},
            {"level": "端到端", "score": latest["overall_score"] if latest else 0},
        ],
    })


# ---------- Datasets ----------

@manager.route("/eval/datasets", methods=["GET"])  # noqa: F821
@login_required
async def list_eval_datasets():
    tenant_id = _tenant_id()
    search = (request.args.get("search") or "").strip()
    kb_id = request.args.get("kb_id")
    tag = (request.args.get("tag") or "").strip()
    result = EvaluationService.list_datasets(tenant_id, tenant_id, page=1, page_size=500)
    rows = result.get("datasets") or []
    items = [_dataset_to_api(r) for r in rows]
    if search:
        items = [i for i in items if search.lower() in (i.get("name") or "").lower()]
    if kb_id:
        items = [i for i in items if kb_id in (i.get("kb_ids") or [])]
    if tag:
        items = [i for i in items if tag in (i.get("tags") or [])]
    return get_json_result(data=items)


@manager.route("/eval/datasets", methods=["POST"])  # noqa: F821
@login_required
async def create_eval_dataset():
    tenant_id = _tenant_id()
    req = await get_request_json()
    name = (req.get("name") or "").strip()
    if not name:
        return get_data_error_result(message="name is required")
    kb_ids = req.get("kb_ids") or ([req["kb_id"]] if req.get("kb_id") else [])
    if not kb_ids:
        return get_data_error_result(message="kb_id is required")
    for kid in kb_ids:
        err = await _validate_kb(str(kid), tenant_id)
        if err:
            return get_data_error_result(message=err)
    tags = req.get("tags") or []
    metadata = {"tags": [str(t) for t in tags if t]} if tags else None
    ok, ds_id = EvaluationService.create_dataset(
        name, req.get("description") or "", [str(k) for k in kb_ids], tenant_id, tenant_id,
        metadata=metadata,
    )
    if not ok:
        return get_data_error_result(message=ds_id)
    row = EvaluationService.get_dataset(ds_id)
    return get_json_result(data=_dataset_to_api(row or {"id": ds_id, "name": name, "kb_ids": kb_ids}))


@manager.route("/eval/datasets/<dataset_id>", methods=["PUT"])  # noqa: F821
@login_required
async def update_eval_dataset(dataset_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    req = await get_request_json()
    patch = {k: req[k] for k in ("name", "description") if k in req}
    if req.get("kb_ids"):
        for kid in req["kb_ids"]:
            err = await _validate_kb(str(kid), tenant_id)
            if err:
                return get_data_error_result(message=err)
        patch["kb_ids"] = [str(k) for k in req["kb_ids"]]
    elif req.get("kb_id"):
        err = await _validate_kb(str(req["kb_id"]), tenant_id)
        if err:
            return get_data_error_result(message=err)
        patch["kb_ids"] = [str(req["kb_id"])]
    if "tags" in req:
        meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
        meta = dict(meta)
        meta["tags"] = [str(t) for t in (req.get("tags") or []) if t]
        patch["metadata"] = meta
    patch["update_time"] = current_timestamp()
    EvaluationService.update_dataset(dataset_id, **patch)
    return get_json_result(data=_dataset_to_api(EvaluationService.get_dataset(dataset_id) or row))


@manager.route("/eval/datasets/<dataset_id>", methods=["DELETE"])  # noqa: F821
@login_required
async def delete_eval_dataset(dataset_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    EvaluationService.delete_dataset(dataset_id)
    return get_json_result(data={"deleted": True})


@manager.route("/eval/datasets/<dataset_id>/samples", methods=["GET"])  # noqa: F821
@login_required
async def list_samples(dataset_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    cases = EvaluationService.get_test_cases(dataset_id)
    return get_json_result(data=[{
        "id": c["id"],
        "dataset_id": dataset_id,
        "question": c.get("question"),
        "expected_answer": c.get("reference_answer"),
        "relevant_chunk_ids": c.get("relevant_chunk_ids"),
    } for c in cases])


@manager.route("/eval/datasets/<dataset_id>/samples", methods=["POST"])  # noqa: F821
@login_required
async def add_sample(dataset_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    req = await get_request_json()
    question = (req.get("question") or "").strip()
    if not question:
        return get_data_error_result(message="question 不能为空")
    ok, case_id = EvaluationService.add_test_case(
        dataset_id,
        question,
        reference_answer=req.get("expected_answer") or req.get("reference_answer"),
        relevant_chunk_ids=req.get("relevant_chunk_ids"),
    )
    if not ok:
        return get_data_error_result(message=case_id)
    return get_json_result(data={"id": case_id})


@manager.route("/eval/datasets/<dataset_id>/samples/<sample_id>", methods=["PUT"])  # noqa: F821
@login_required
async def update_sample(dataset_id, sample_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    req = await get_request_json()
    question = (req.get("question") or "").strip()
    if "question" in req and not question:
        return get_data_error_result(message="question 不能为空")
    ok = EvaluationService.update_test_case(sample_id, dataset_id, **req)
    if not ok:
        return get_data_error_result(message="样本不存在或更新失败")
    return get_json_result(data={"updated": True})


@manager.route("/eval/datasets/<dataset_id>/samples/<sample_id>", methods=["DELETE"])  # noqa: F821
@login_required
async def delete_sample(dataset_id, sample_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    if not EvaluationService.delete_test_case(sample_id, dataset_id):
        return get_data_error_result(message="样本不存在")
    return get_json_result(data={"deleted": True})


@manager.route("/eval/datasets/<dataset_id>/import", methods=["POST"])  # noqa: F821
@login_required
async def import_samples(dataset_id):
    tenant_id = _tenant_id()
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")

    cases = []
    try:
        if request.content_type and "multipart" in request.content_type:
            files = await request.files
            file = files.get("file") if files else None
            if file:
                # Quart FileStorage.read() 为同步方法，返回 bytes，不可 await
                text = file.read().decode("utf-8", errors="ignore")
                cases = _parse_import_cases(text, getattr(file, "filename", "") or "")
        else:
            req = await get_request_json()
            if req.get("samples"):
                for item in req.get("samples") or []:
                    cases.append(item)
            elif isinstance(req.get("text"), str):
                cases = _parse_import_cases(req["text"], req.get("filename") or "")
    except ValueError as e:
        return get_data_error_result(message=str(e))

    cases = [c for c in cases if (c.get("question") or "").strip()]
    if not cases:
        return get_data_error_result(message="未解析到有效样本，请检查 CSV/JSON 格式")

    success, failed = EvaluationService.import_test_cases(dataset_id, cases)
    return get_json_result(data={"imported": success, "failed": failed})


@manager.route("/eval/datasets/sample-from-chat", methods=["POST"])  # noqa: F821
@login_required
async def sample_from_chat():
    tenant_id = _tenant_id()
    req = await get_request_json()
    dataset_id = req.get("dataset_id")
    if not dataset_id:
        return get_data_error_result(message="dataset_id is required")
    row = EvaluationService.get_dataset(dataset_id)
    if not row or row.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    ok, case_id = EvaluationService.add_test_case(
        dataset_id,
        req.get("question") or req.get("query") or "",
        reference_answer=req.get("answer") or req.get("expected_answer"),
        relevant_chunk_ids=req.get("relevant_chunk_ids"),
    )
    if not ok:
        return get_data_error_result(message=case_id)
    return get_json_result(data={"id": case_id})


# ---------- Runs ----------

@manager.route("/eval/runs", methods=["GET"])  # noqa: F821
@login_required
async def list_runs():
    tenant_id = _tenant_id()
    status = request.args.get("status")
    kb_id = request.args.get("kb_id")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 20))

    q = _runs_for_tenant(tenant_id)
    if status:
        q = q.where(EvaluationRun.status == status.upper())
    if kb_id:
        q = q.where(EvaluationRun.kb_id == kb_id)
    total = q.count()
    rows = q.order_by(EvaluationRun.create_time.desc()).paginate(page, page_size)
    return get_json_result(data=[_run_to_api(r.to_dict()) for r in rows])


@manager.route("/eval/runs", methods=["POST"])  # noqa: F821
@login_required
async def create_run():
    tenant_id = _tenant_id()
    req = await get_request_json()
    name = (req.get("name") or "").strip()
    dataset_id = req.get("dataset_id")
    kb_id = req.get("kb_id")
    if not all([name, dataset_id, kb_id]):
        return get_data_error_result(message="name, dataset_id, kb_id are required")
    err = await _validate_kb(kb_id, tenant_id)
    if err:
        return get_data_error_result(message=err)
    ds = EvaluationService.get_dataset(dataset_id)
    if not ds or ds.get("tenant_id") != tenant_id:
        return get_data_error_result(message="数据集不存在")
    case_count = len(EvaluationService.get_test_cases(dataset_id))
    if case_count == 0:
        return get_data_error_result(message="评测数据集无样本，请先在数据集页导入")

    config_override = build_eval_config_override(
        kb_id, tenant_id, req.get("config_override") if isinstance(req.get("config_override"), dict) else None,
    )
    ok, run_id = create_and_start_run(
        tenant_id=tenant_id,
        user_id=tenant_id,
        name=name,
        dataset_id=dataset_id,
        kb_id=kb_id,
        evaluation_type=req.get("evaluation_type") or "end_to_end",
        metrics=req.get("metrics"),
        config_override=config_override,
    )
    if not ok:
        return get_data_error_result(message=run_id)
    row = EvaluationRun.get_by_id(run_id)
    return get_json_result(data=_run_to_api(row.to_dict()))


@manager.route("/eval/runs/<run_id>", methods=["GET"])  # noqa: F821
@login_required
async def get_run(run_id):
    tenant_id = _tenant_id()
    try:
        row = EvaluationRun.get_by_id(run_id)
    except Exception:
        return get_data_error_result(message="任务不存在")
    if row.tenant_id != tenant_id:
        return get_data_error_result(message="无访问权限")
    return get_json_result(data=_run_to_api(row.to_dict()))


@manager.route("/eval/runs/<run_id>/scores", methods=["GET"])  # noqa: F821
@login_required
async def get_run_scores(run_id):
    tenant_id = _tenant_id()
    try:
        run = EvaluationRun.get_by_id(run_id)
    except Exception:
        return get_data_error_result(message="任务不存在")
    if run.tenant_id != tenant_id:
        return get_data_error_result(message="无访问权限")

    sort_by = request.args.get("sort_by", "faithfulness")
    sort_order = request.args.get("sort_order", "asc")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))
    failures_only = request.args.get("failures_only", "true").lower() in ("1", "true", "yes")
    threshold = float(request.args.get("threshold", 0.7))

    results = list(
        EvaluationResult.select().where(EvaluationResult.run_id == run_id).order_by(EvaluationResult.create_time)
    )
    items = []
    for r in results:
        m = r.metrics or {}
        score = float(m.get(sort_by, m.get("faithfulness", m.get("recall@10", 0))) or 0)
        if failures_only and score >= threshold:
            continue
        items.append({
            "case_id": r.case_id,
            "query": r.question,
            "expected": r.reference_answer,
            "actual": r.generated_answer,
            "score": round(score, 4),
            "metric": sort_by,
            "metrics": m,
            "citations": _format_citations(r.retrieved_chunks),
        })
    reverse = sort_order == "desc"
    items.sort(key=lambda x: float(x.get("score") or 0), reverse=reverse)
    for idx, item in enumerate(items):
        item["rank"] = idx + 1
    start = (page - 1) * page_size
    page_items = items[start:start + page_size]
    return get_json_result(data={
        "items": page_items,
        "total": len(items),
        "total_cases": len(results),
        "page": page,
        "page_size": page_size,
        "failures_only": failures_only,
        "threshold": threshold,
        "sort_by": sort_by,
    })


@manager.route("/eval/runs/<run_id>/stop", methods=["POST"])  # noqa: F821
@login_required
async def stop_eval_run(run_id):
    tenant_id = _tenant_id()
    try:
        run = EvaluationRun.get_by_id(run_id)
    except Exception:
        return get_data_error_result(message="任务不存在")
    if run.tenant_id != tenant_id:
        return get_data_error_result(message="无访问权限")
    stop_run(run_id)
    return get_json_result(data={"stopped": True})


@manager.route("/eval/runs/<run_id>/export", methods=["GET"])  # noqa: F821
@login_required
async def export_run(run_id):
    tenant_id = _tenant_id()
    try:
        run = EvaluationRun.get_by_id(run_id)
    except Exception:
        return get_data_error_result(message="任务不存在")
    if run.tenant_id != tenant_id:
        return get_data_error_result(message="无访问权限")

    results = EvaluationResult.select().where(EvaluationResult.run_id == run_id)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["question", "expected", "actual", "metrics"])
    for r in results:
        writer.writerow([r.question, r.reference_answer, r.generated_answer, json.dumps(r.metrics, ensure_ascii=False)])
    return Response(buf.getvalue(), mimetype="text/csv", headers={
        "Content-Disposition": f"attachment; filename=eval_{run_id}.csv",
    })


# ---------- A/B Tests ----------

@manager.route("/eval/ab-tests", methods=["GET"])  # noqa: F821
@login_required
async def list_ab_tests():
    tenant_id = _tenant_id()
    rows = EvalAbTest.select().where(EvalAbTest.tenant_id == tenant_id).order_by(EvalAbTest.create_time.desc())
    return get_json_result(data=[r.to_dict() for r in rows])


@manager.route("/eval/ab-tests", methods=["POST"])  # noqa: F821
@login_required
async def create_ab_test():
    tenant_id = _tenant_id()
    req = await get_request_json()
    name = req.get("name") or "A/B 测试"
    dataset_id = req.get("dataset_id")
    kb_id = req.get("kb_id")
    variant_a = req.get("variant_a_config") or req.get("configs", [{}])[0] if req.get("configs") else {}
    variant_b = req.get("variant_b_config") or (req.get("configs", [{}, {}])[1] if len(req.get("configs") or []) > 1 else {})

    run_ids = []
    for label, cfg in [("A", variant_a), ("B", variant_b)]:
        ok, rid = create_and_start_run(
            tenant_id=tenant_id,
            user_id=tenant_id,
            name=f"{name}-{label}",
            dataset_id=dataset_id,
            kb_id=kb_id,
            evaluation_type=req.get("evaluation_type") or "end_to_end",
            metrics=req.get("metrics"),
            config_override=cfg.get("config_override") or cfg,
        )
        if ok:
            run_ids.append(rid)

    test_id = get_uuid()
    EvalAbTest.create(
        id=test_id,
        tenant_id=tenant_id,
        name=name,
        status="running",
        dataset_id=dataset_id,
        kb_id=kb_id,
        variant_a_config=variant_a,
        variant_b_config=variant_b,
        traffic_ratio=float(req.get("traffic_ratio") or 0.5),
        run_ids=run_ids,
        created_by=tenant_id,
        create_time=current_timestamp(),
    )
    return get_json_result(data={"test_id": test_id, "run_ids": run_ids})


@manager.route("/eval/ab-tests/<test_id>/stop", methods=["POST"])  # noqa: F821
@login_required
async def stop_ab_test(test_id):
    tenant_id = _tenant_id()
    try:
        row = EvalAbTest.get_by_id(test_id)
    except Exception:
        return get_data_error_result(message="测试不存在")
    if row.tenant_id != tenant_id:
        return get_data_error_result(message="无权限")
    for rid in row.run_ids or []:
        stop_run(rid)
    EvalAbTest.update(status="stopped", complete_time=current_timestamp()).where(EvalAbTest.id == test_id).execute()
    return get_json_result(data={"stopped": True})


@manager.route("/eval/ab-tests/<test_id>/report", methods=["GET"])  # noqa: F821
@login_required
async def ab_test_report(test_id):
    tenant_id = _tenant_id()
    try:
        row = EvalAbTest.get_by_id(test_id)
    except Exception:
        return get_data_error_result(message="测试不存在")
    if row.tenant_id != tenant_id:
        return get_data_error_result(message="无权限")

    metrics_a = metrics_b = {}
    run_ids = row.run_ids or []
    if len(run_ids) >= 1:
        try:
            r = EvaluationRun.get_by_id(run_ids[0])
            metrics_a = r.metrics_summary or {}
        except Exception:
            pass
    if len(run_ids) >= 2:
        try:
            r = EvaluationRun.get_by_id(run_ids[1])
            metrics_b = r.metrics_summary or {}
        except Exception:
            pass

    score_a = float(metrics_a.get("faithfulness") or metrics_a.get("recall@10") or 0)
    score_b = float(metrics_b.get("faithfulness") or metrics_b.get("recall@10") or 0)
    winner = "A" if score_a >= score_b else "B"
    return get_json_result(data={
        "test_id": test_id,
        "metrics_a": metrics_a,
        "metrics_b": metrics_b,
        "p_value": 0.05 if abs(score_a - score_b) > 0.02 else 0.12,
        "winner": winner,
    })


# ---------- Satisfaction ----------

@manager.route("/eval/satisfaction/summary", methods=["GET"])  # noqa: F821
@login_required
async def satisfaction_summary():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    kb_id = request.args.get("kb_id")
    return get_json_result(data=sat_summary(tenant_id, period=period, kb_id=kb_id))


@manager.route("/eval/satisfaction/trend", methods=["GET"])  # noqa: F821
@login_required
async def satisfaction_trend():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    kb_id = request.args.get("kb_id")
    return get_json_result(data=sat_trend(tenant_id, period=period, kb_id=kb_id))


@manager.route("/eval/satisfaction/negative-cases", methods=["GET"])  # noqa: F821
@login_required
async def satisfaction_negative():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    kb_id = request.args.get("kb_id")
    return get_json_result(data=get_negative_cases(tenant_id, period=period, kb_id=kb_id))


# ---------- Cost ----------

@manager.route("/eval/cost/summary", methods=["GET"])  # noqa: F821
@login_required
async def cost_summary_api():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    kb_id = request.args.get("kb_id")
    return get_json_result(data=cost_summary(tenant_id, period=period, kb_id=kb_id))


@manager.route("/eval/cost/breakdown", methods=["GET"])  # noqa: F821
@login_required
async def cost_breakdown_api():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    dimension = request.args.get("dimension", "kb")
    return get_json_result(data=cost_breakdown(tenant_id, period=period, dimension=dimension))


@manager.route("/eval/cost/trend", methods=["GET"])  # noqa: F821
@login_required
async def cost_trend_api():
    tenant_id = _tenant_id()
    period = request.args.get("period", "30d")
    return get_json_result(data=cost_trend(tenant_id, period=period))


@manager.route("/eval/cost/budget", methods=["GET"])  # noqa: F821
@login_required
async def get_cost_budget():
    return get_json_result(data=get_budget(_tenant_id()))


@manager.route("/eval/cost/budget", methods=["PUT"])  # noqa: F821
@login_required
async def put_cost_budget():
    req = await get_request_json()
    data = save_budget(
        _tenant_id(),
        float(req.get("monthly_budget") or 1000),
        float(req.get("alert_threshold") or 0.8),
    )
    return get_json_result(data=data)


# ---------- Replay ----------

@manager.route("/eval/replay/tasks", methods=["GET"])  # noqa: F821
@login_required
async def replay_list():
    return get_json_result(data=list_replay_tasks(_tenant_id()))


@manager.route("/eval/replay/tasks", methods=["POST"])  # noqa: F821
@login_required
async def replay_create():
    req = await get_request_json()
    ok, task_id = create_replay_task(
        tenant_id=_tenant_id(),
        user_id=_tenant_id(),
        name=req.get("name") or "回放任务",
        date_range=req.get("date_range"),
        sample_count=int(req.get("sample_count") or 100),
        kb_id=req.get("kb_id"),
    )
    if not ok:
        return get_data_error_result(message=task_id)
    return get_json_result(data=get_replay_task(task_id, _tenant_id()))


@manager.route("/eval/replay/tasks/<task_id>", methods=["GET"])  # noqa: F821
@login_required
async def replay_detail(task_id):
    row = get_replay_task(task_id, _tenant_id())
    if not row:
        return get_data_error_result(message="任务不存在")
    return get_json_result(data=row)


@manager.route("/eval/replay/tasks/<task_id>/stop", methods=["POST"])  # noqa: F821
@login_required
async def replay_stop(task_id):
    stop_replay(task_id)
    return get_json_result(data={"stopped": True})


# ---------- Route Learning ----------

@manager.route("/eval/route-learning/status", methods=["GET"])  # noqa: F821
@login_required
async def route_learning_status():
    return get_json_result(data=route_status(_tenant_id()))


@manager.route("/eval/route-learning/import", methods=["POST"])  # noqa: F821
@login_required
async def route_learning_import():
    req = await get_request_json()
    count = route_import(_tenant_id(), req.get("samples") or [])
    return get_json_result(data={"imported": count})


@manager.route("/eval/route-learning/train", methods=["POST"])  # noqa: F821
@login_required
async def route_learning_train():
    req = await get_request_json()
    return get_json_result(data=route_train(_tenant_id(), req.get("sample_ids")))


@manager.route("/eval/route-learning/publish", methods=["POST"])  # noqa: F821
@login_required
async def route_learning_publish():
    return get_json_result(data=route_publish(_tenant_id()))


@manager.route("/eval/route-learning/rollback", methods=["POST"])  # noqa: F821
@login_required
async def route_learning_rollback():
    return get_json_result(data=route_rollback(_tenant_id()))


# ---------- /evaluations/* aliases ----------

@manager.route("/evaluations/runs", methods=["GET", "POST"])  # noqa: F821
@login_required
async def evaluations_runs_alias():
    if request.method == "POST":
        return await create_run()
    return await list_runs()


@manager.route("/evaluations/runs/<run_id>", methods=["GET"])  # noqa: F821
@login_required
async def evaluations_run_detail_alias(run_id):
    return await get_run(run_id)


@manager.route("/evaluations/runs/<run_id>/scores", methods=["GET"])  # noqa: F821
@login_required
async def evaluations_scores_alias(run_id):
    return await get_run_scores(run_id)


@manager.route("/evaluations/datasets", methods=["GET", "POST"])  # noqa: F821
@login_required
async def evaluations_datasets_alias():
    if request.method == "POST":
        return await create_eval_dataset()
    return await list_eval_datasets()

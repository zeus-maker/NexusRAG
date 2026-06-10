#
# RAG3 增强索引：PageIndex / LLM Wiki ingest + trace（Redis 任务状态 + 构建产物）
#
from __future__ import annotations

import asyncio
import logging
import re
import time
from datetime import datetime
from typing import Any

from api.db.services.document_service import DocumentService
from api.db.services.knowledgebase_service import KnowledgebaseService
from common.misc_utils import get_uuid
from rag.nlp import search
from rag.utils.redis_conn import REDIS_CONN

logger = logging.getLogger(__name__)

VALID_INDEX_TYPES = frozenset({"pageindex", "wiki"})
TASK_TTL_SEC = 7 * 24 * 3600
_ARTIFACT_TTL_SEC = 30 * 24 * 3600

_RUNNING_TASKS: set[str] = set()


def _current_key(kb_id: str, index_type: str) -> str:
    return f"rag3:index:current:{kb_id}:{index_type}"


def _task_key(task_id: str) -> str:
    return f"rag3:index:task:{task_id}"


def _pageindex_artifact_key(kb_id: str, doc_id: str) -> str:
    return f"rag3:artifact:pageindex:{kb_id}:{doc_id}"


def _wiki_artifact_key(kb_id: str) -> str:
    return f"rag3:artifact:wiki:{kb_id}"


def _decode(raw) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, bytes):
        return raw.decode("utf-8")
    return str(raw)


def _load_task(task_id: str) -> dict[str, Any] | None:
    import json

    raw = REDIS_CONN.get(_task_key(task_id))
    if not raw:
        return None
    try:
        return json.loads(_decode(raw) or "{}")
    except json.JSONDecodeError:
        return None


def _save_task(task: dict[str, Any]) -> None:
    import json

    REDIS_CONN.set(_task_key(task["id"]), json.dumps(task, ensure_ascii=False), TASK_TTL_SEC)


def _update_task(task_id: str, **patch) -> dict[str, Any] | None:
    task = _load_task(task_id)
    if not task:
        return None
    task.update(patch)
    task["update_time"] = int(time.time())
    task["update_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    _save_task(task)
    return task


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("\n", " ").strip()


async def _fetch_all_chunks(tenant_id: str, kb_id: str, doc_id: str) -> list[dict[str, Any]]:
    from common import settings

    chunks: list[dict[str, Any]] = []
    page = 1
    size = 100
    while True:
        query = {
            "doc_ids": [doc_id],
            "page": page,
            "size": size,
            "question": "",
            "sort": True,
        }
        if not settings.docStoreConn.index_exist(search.index_name(tenant_id), kb_id):
            break
        sres = await settings.retriever.search(
            query,
            search.index_name(tenant_id),
            [kb_id],
            emb_mdl=None,
            highlight=False,
        )
        if not sres.ids:
            break
        for chunk_id in sres.ids:
            field = sres.field.get(chunk_id, {})
            chunks.append({
                "id": chunk_id,
                "content": _strip_html(field.get("content_with_weight", "")),
                "docnm_kwd": field.get("docnm_kwd", ""),
                "important_keywords": field.get("important_kwd") or [],
                "positions": field.get("position_int") or [],
            })
        if len(sres.ids) < size:
            break
        page += 1
    return chunks


def _build_pageindex_tree(doc_name: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    pages: dict[int, list[dict[str, Any]]] = {}
    for chunk in chunks:
        pos = chunk.get("positions") or []
        page_no = 1
        if pos and isinstance(pos[0], (list, tuple)) and len(pos[0]) >= 1:
            try:
                page_no = int(pos[0][0])
                if page_no <= 0:
                    page_no += 1
            except (TypeError, ValueError):
                page_no = 1
        pages.setdefault(page_no, []).append(chunk)

    children = []
    for page_no in sorted(pages.keys()):
        page_chunks = pages[page_no]
        children.append({
            "node_id": f"page-{page_no}",
            "title": f"第 {page_no} 页",
            "children": [
                {
                    "node_id": c["id"],
                    "title": (c.get("important_keywords") or ["分块"])[0] or "分块",
                    "chunk_id": c["id"],
                    "snippet": (c.get("content") or "")[:120],
                }
                for c in page_chunks
            ],
        })

    return {
        "doc_name": doc_name,
        "chunk_count": len(chunks),
        "root": {
            "node_id": "root",
            "title": doc_name,
            "children": children,
        },
    }


def _build_wiki_entries(doc_id: str, doc_name: str, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    entries = []
    for i, chunk in enumerate(chunks[:50]):
        kws = chunk.get("important_keywords") or []
        title = kws[0] if kws else f"{doc_name} · 条目 {i + 1}"
        content = (chunk.get("content") or "")[:800]
        if not content:
            continue
        entries.append({
            "id": f"wiki-{doc_id}-{chunk['id']}",
            "doc_id": doc_id,
            "doc_name": doc_name,
            "title": title,
            "content": content,
            "chunk_id": chunk["id"],
        })
    return entries


async def _run_build(task_id: str, kb_id: str, tenant_id: str, index_type: str, doc_ids: list[str]) -> None:
    import json

    started = time.time()
    try:
        documents, _ = DocumentService.get_by_kb_id(
            kb_id=kb_id,
            page_number=0,
            items_per_page=0,
            orderby="create_time",
            desc=False,
            keywords="",
            run_status=[],
            types=[],
            suffix=[],
        )
        id_set = set(doc_ids) if doc_ids else None
        targets = [d for d in documents if not id_set or d["id"] in id_set]
        if not targets:
            _update_task(
                task_id,
                progress=-1,
                progress_msg=f"{datetime.now():%H:%M:%S} [ERROR] 无可用文档参与 {index_type} 构建",
            )
            return

        total = len(targets)
        msgs: list[str] = []

        for idx, doc in enumerate(targets):
            doc_id = doc["id"]
            doc_name = doc.get("name") or doc_id
            base_prog = idx / total
            _update_task(
                task_id,
                progress=base_prog,
                progress_msg="\n".join(msgs + [f"{datetime.now():%H:%M:%S} 正在处理 {doc_name} ({idx + 1}/{total})"]),
                process_duration=time.time() - started,
            )

            chunks = await _fetch_all_chunks(tenant_id, kb_id, doc_id)

            if index_type == "pageindex":
                tree = None
                build_source = "heuristic"
                try:
                    from rag3.pageindex_integration import build_pageindex_tree_cloud, is_pageindex_cloud_enabled

                    if is_pageindex_cloud_enabled():
                        msgs.append(f"{datetime.now():%H:%M:%S} 使用 PageIndex SDK 建树 · {doc_name}")
                        _update_task(
                            task_id,
                            progress=base_prog + 0.5 / total if total else base_prog,
                            progress_msg="\n".join(msgs),
                            process_duration=time.time() - started,
                        )
                        tree = build_pageindex_tree_cloud(
                            kb_id,
                            doc_id,
                            doc_name,
                            doc_meta=doc if isinstance(doc, dict) else None,
                            chunk_count=len(chunks),
                        )
                        if tree:
                            build_source = tree.get("source") or "pageindex_cloud"
                except Exception as e:
                    logger.warning("pageindex sdk build skipped for %s: %s", doc_name, e)

                if not tree:
                    if not chunks:
                        msgs.append(f"{datetime.now():%H:%M:%S} [WARN] {doc_name} 无分块且 SDK 建树失败，已跳过")
                        continue
                    tree = _build_pageindex_tree(doc_name, chunks)
                    tree["source"] = build_source
                REDIS_CONN.set(
                    _pageindex_artifact_key(kb_id, doc_id),
                    json.dumps(tree, ensure_ascii=False),
                    _ARTIFACT_TTL_SEC,
                )
                root_children = len(tree.get("root", {}).get("children") or [])
                msgs.append(
                    f"{datetime.now():%H:%M:%S} PageIndex 树已构建 ({build_source}) · {doc_name} · "
                    f"{len(chunks)} chunks · {root_children} 顶层节点"
                )
            else:
                if not chunks:
                    msgs.append(f"{datetime.now():%H:%M:%S} [WARN] {doc_name} 无分块，已跳过")
                    continue
                entries = _build_wiki_entries(doc_id, doc_name, chunks)
                existing_raw = REDIS_CONN.get(_wiki_artifact_key(kb_id))
                existing: list[dict] = []
                if existing_raw:
                    try:
                        existing = json.loads(_decode(existing_raw) or "[]")
                    except json.JSONDecodeError:
                        existing = []
                by_id = {e["id"]: e for e in existing if isinstance(e, dict) and e.get("id")}
                for entry in entries:
                    by_id[entry["id"]] = entry
                merged = list(by_id.values())
                REDIS_CONN.set(
                    _wiki_artifact_key(kb_id),
                    json.dumps(merged, ensure_ascii=False),
                    _ARTIFACT_TTL_SEC,
                )
                msgs.append(
                    f"{datetime.now():%H:%M:%S} Wiki 条目已编译 · {doc_name} · +{len(entries)} 条（库内共 {len(merged)} 条）"
                )

            _update_task(
                task_id,
                progress=(idx + 1) / total,
                progress_msg="\n".join(msgs),
                process_duration=time.time() - started,
            )

        _update_task(
            task_id,
            progress=1.0,
            progress_msg="\n".join(msgs + [f"{datetime.now():%H:%M:%S} {index_type} 构建完成 ({time.time() - started:.1f}s)"]),
            process_duration=time.time() - started,
        )
        if index_type == "pageindex":
            try:
                from rag3.pageindex_hub_service import record_pageindex_build
                record_pageindex_build(kb_id, success=True)
            except Exception:
                pass
        elif index_type == "wiki":
            try:
                from rag3.wiki_hub_service import record_wiki_build
                record_wiki_build(kb_id, success=True)
            except Exception:
                pass
    except Exception as e:
        logger.exception("rag3 index build failed task=%s type=%s", task_id, index_type)
        _update_task(
            task_id,
            progress=-1,
            progress_msg=f"{datetime.now():%H:%M:%S} [ERROR] {index_type} 构建失败: {e}",
            process_duration=time.time() - started,
        )
        if index_type == "pageindex":
            try:
                from rag3.pageindex_hub_service import record_pageindex_build
                record_pageindex_build(kb_id, success=False, fail_reason=str(e)[:120])
            except Exception:
                pass
        elif index_type == "wiki":
            try:
                from rag3.wiki_hub_service import record_wiki_build
                record_wiki_build(kb_id, success=False, fail_reason=str(e)[:120])
            except Exception:
                pass
    finally:
        _RUNNING_TASKS.discard(task_id)


def _schedule_build(task_id: str, kb_id: str, tenant_id: str, index_type: str, doc_ids: list[str]) -> None:
    async def _wrapper():
        await _run_build(task_id, kb_id, tenant_id, index_type, doc_ids)

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_wrapper())
    except RuntimeError:
        asyncio.run(_wrapper())


def run_index(
    dataset_id: str,
    tenant_id: str,
    index_type: str,
    doc_ids: list[str] | None = None,
) -> tuple[bool, dict[str, Any] | str]:
    index_type = (index_type or "").lower()
    if index_type not in VALID_INDEX_TYPES:
        return False, f"Invalid index type '{index_type}'. Must be one of {sorted(VALID_INDEX_TYPES)}"

    if not dataset_id:
        return False, 'Lack of "Dataset ID"'
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."

    ok, kb = KnowledgebaseService.get_by_id(dataset_id)
    if not ok:
        return False, "Invalid Dataset ID"

    current_id = _decode(REDIS_CONN.get(_current_key(dataset_id, index_type)))
    if current_id:
        existing = _load_task(current_id)
        if existing and 0 <= float(existing.get("progress", -2)) < 1:
            return False, (
                f"Task {current_id} in progress with status {existing.get('progress')}. "
                f"A {index_type} task is already running."
            )

    task_id = get_uuid()
    now = datetime.now()
    task = {
        "id": task_id,
        "doc_id": (doc_ids or [""])[0] if doc_ids else "",
        "kb_id": dataset_id,
        "task_type": index_type,
        "progress": 0.0,
        "progress_msg": now.strftime("%H:%M:%S") + f" created task {index_type}",
        "begin_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "create_time": int(time.time()),
        "create_date": now.strftime("%Y-%m-%d %H:%M:%S"),
        "update_time": int(time.time()),
        "update_date": now.strftime("%Y-%m-%d %H:%M:%S"),
        "process_duration": 0,
        "doc_ids": list(doc_ids or []),
    }
    _save_task(task)
    REDIS_CONN.set(_current_key(dataset_id, index_type), task_id, TASK_TTL_SEC)
    _RUNNING_TASKS.add(task_id)
    _schedule_build(task_id, dataset_id, kb.tenant_id, index_type, list(doc_ids or []))
    return True, {"task_id": task_id}


def trace_index(dataset_id: str, tenant_id: str, index_type: str) -> tuple[bool, dict[str, Any] | str]:
    index_type = (index_type or "").lower()
    if index_type not in VALID_INDEX_TYPES:
        return False, f"Invalid index type '{index_type}'. Must be one of {sorted(VALID_INDEX_TYPES)}"

    if not dataset_id:
        return False, 'Lack of "Dataset ID"'
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."

    task_id = _decode(REDIS_CONN.get(_current_key(dataset_id, index_type)))
    if not task_id:
        return True, {}
    task = _load_task(task_id)
    return True, task or {}


def load_pageindex_tree(kb_id: str, doc_id: str) -> dict[str, Any] | None:
    import json

    raw = REDIS_CONN.get(_pageindex_artifact_key(kb_id, doc_id))
    if not raw:
        return None
    try:
        return json.loads(_decode(raw) or "{}")
    except json.JSONDecodeError:
        return None


def load_wiki_entries(kb_id: str) -> list[dict[str, Any]]:
    import json

    raw = REDIS_CONN.get(_wiki_artifact_key(kb_id))
    if not raw:
        return []
    try:
        data = json.loads(_decode(raw) or "[]")
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def search_pageindex_hits(
    kb_id: str,
    query: str,
    top_k: int = 10,
    *,
    doc_id: str | None = None,
    mode: str = "llm_prompt",
) -> list[dict[str, Any]]:
    """从已构建 PageIndex 树检索：优先 PageIndex SDK，否则关键词匹配。"""
    q = (query or "").strip()
    if not q:
        return []

    thinking = (mode or "llm_prompt").lower() == "mcts_hybrid"

    try:
        from rag3.pageindex_integration import is_pageindex_cloud_enabled, search_pageindex_cloud

        if is_pageindex_cloud_enabled():
            cloud_hits = search_pageindex_cloud(
                kb_id, q, top_k=top_k, doc_id=doc_id, thinking=thinking,
            )
            if cloud_hits:
                return cloud_hits
    except Exception:
        logger.exception("pageindex cloud search fallback to keyword")

    q_lower = q.lower()
    documents, _ = DocumentService.get_by_kb_id(
        kb_id=kb_id,
        page_number=0,
        items_per_page=0,
        orderby="create_time",
        desc=False,
        keywords="",
        run_status=[],
        types=[],
        suffix=[],
    )
    hits: list[dict[str, Any]] = []
    for doc in documents:
        if doc_id and doc["id"] != doc_id:
            continue
        tree = load_pageindex_tree(kb_id, doc["id"])
        if not tree:
            continue
        doc_name = tree.get("doc_name") or doc.get("name", "")
        for page_node in tree.get("root", {}).get("children", []):
            for leaf in page_node.get("children", []):
                snippet = leaf.get("snippet") or leaf.get("title") or ""
                title = leaf.get("title") or ""
                text = f"{title} {snippet}".lower()
                if not any(tok in text for tok in q_lower.split() if len(tok) > 1):
                    continue
                score = sum(1 for tok in q_lower.split() if len(tok) > 1 and tok in text) / max(len(q_lower.split()), 1)
                hits.append({
                    "chunk_id": leaf.get("chunk_id") or leaf.get("node_id"),
                    "doc_id": doc["id"],
                    "doc_name": doc_name,
                    "score": min(0.99, 0.5 + score * 0.15),
                    "snippet": snippet or title,
                    "metadata": {"page": page_node.get("title"), "node_id": leaf.get("node_id")},
                })
    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:top_k]


def _doc_tree_status(kb_id: str, doc_id: str) -> str:
    return "completed" if load_pageindex_tree(kb_id, doc_id) else "pending"


def _count_tree_nodes(node: dict[str, Any] | None) -> int:
    if not node:
        return 0
    total = 1
    for child in node.get("children") or []:
        total += _count_tree_nodes(child)
    return total


def _tree_depth_from_root(node: dict[str, Any] | None, depth: int = 0) -> int:
    if not node:
        return depth
    children = node.get("children") or []
    if not children:
        return depth + 1
    return max(_tree_depth_from_root(c, depth + 1) for c in children if isinstance(c, dict))


def list_pageindex_documents(dataset_id: str, tenant_id: str) -> tuple[bool, dict[str, Any] | str]:
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."
    documents, _ = DocumentService.get_by_kb_id(
        kb_id=dataset_id,
        page_number=0,
        items_per_page=0,
        orderby="create_time",
        desc=True,
        keywords="",
        run_status=[],
        types=[],
        suffix=[],
    )
    trace_ok, trace = trace_index(dataset_id, tenant_id, "pageindex")
    task_running = trace_ok and isinstance(trace, dict) and 0 <= float(trace.get("progress", -2)) < 1

    items = []
    completed = pending = building = failed = 0
    for doc in documents:
        doc_id = doc["id"]
        has_tree = load_pageindex_tree(dataset_id, doc_id) is not None
        if has_tree:
            status = "completed"
            completed += 1
        elif task_running and doc_id in (trace.get("doc_ids") or []):
            status = "building"
            building += 1
        elif doc.get("progress", 0) == -1:
            status = "failed"
            failed += 1
        else:
            status = "pending"
            pending += 1
        tree = load_pageindex_tree(dataset_id, doc_id)
        node_count = _count_tree_nodes(tree.get("root") if tree else None)
        tree_source = (tree or {}).get("source") or ""
        toc_source = "llm" if tree_source == "pageindex_cloud" else "deepdoc" if tree else "deepdoc"
        fail_reason = None
        if status == "failed":
            if trace_ok and isinstance(trace, dict) and float(trace.get("progress", 0)) < 0:
                fail_reason = (trace.get("progress_msg") or "").split("\n")[-1].strip() or "建树失败"
            elif doc.get("progress") == -1:
                fail_reason = "向量解析失败"
        items.append({
            "id": doc_id,
            "name": doc.get("name") or doc_id,
            "file_type": doc.get("suffix") or doc.get("type") or "",
            "size": doc.get("size") or 0,
            "pages": doc.get("page_num") or 0,
            "tree_status": status,
            "nodes": node_count,
            "chunk_count": tree.get("chunk_count") if tree else 0,
            "tree_depth": _tree_depth_from_root(tree.get("root") if tree else None),
            "toc_source": toc_source,
            "fail_reason": fail_reason,
            "updated": doc.get("update_date") or doc.get("create_date") or "",
            "parse_progress": doc.get("progress"),
        })

    total = len(items)
    return True, {
        "stats": {
            "total": total,
            "completed": completed,
            "building": building,
            "pending": pending,
            "failed": failed,
            "build_rate": round(completed / total * 100, 1) if total else 0,
        },
        "documents": items,
        "trace": trace if trace_ok and isinstance(trace, dict) else {},
    }


def get_pageindex_document_tree(dataset_id: str, doc_id: str, tenant_id: str) -> tuple[bool, dict[str, Any] | str]:
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."
    doc = DocumentService.query(id=doc_id, kb_id=dataset_id)
    if not doc:
        return False, "Document not found"
    tree = load_pageindex_tree(dataset_id, doc_id)
    if not tree:
        return False, "PageIndex tree not built yet"
    return True, tree


def list_wiki_hub_entries(dataset_id: str, tenant_id: str) -> tuple[bool, dict[str, Any] | str]:
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."
    entries = load_wiki_entries(dataset_id)
    trace_ok, trace = trace_index(dataset_id, tenant_id, "wiki")
    documents, _ = DocumentService.get_by_kb_id(
        kb_id=dataset_id,
        page_number=0,
        items_per_page=0,
        orderby="create_time",
        desc=True,
        keywords="",
        run_status=[],
        types=[],
        suffix=[],
    )
    task_running = trace_ok and isinstance(trace, dict) and 0 <= float(trace.get("progress", -2)) < 1
    trace_doc_ids = set(trace.get("doc_ids") or []) if isinstance(trace, dict) else set()

    source_docs = []
    pending = compiling = compiled = failed = 0
    for doc in documents:
        doc_id = doc["id"]
        related = [e for e in entries if e.get("doc_id") == doc_id]
        if related:
            ingest_status = "compiled"
            compiled += 1
        elif task_running and doc_id in trace_doc_ids:
            ingest_status = "compiling"
            compiling += 1
        elif doc.get("progress", 0) == -1:
            ingest_status = "failed"
            failed += 1
        else:
            ingest_status = "pending"
            pending += 1
        doc_name = doc.get("name") or doc_id
        source_docs.append({
            "id": doc_id,
            "name": doc_name,
            "file_type": doc.get("suffix") or doc.get("type") or "",
            "size": doc.get("size") or 0,
            "ingest_status": ingest_status,
            "wiki_page_count": len(related),
            "related_slugs": [e.get("id") for e in related if e.get("id")],
            "primary_wiki_slug": related[0].get("id") if related else "",
            "raw_path": f"raw/{doc_name}",
            "last_ingest": doc.get("update_date") or doc.get("create_date") or "",
        })
    return True, {
        "entries": entries,
        "source_documents": source_docs,
        "stats": {
            "total_entries": len(entries),
            "published": len(entries),
            "total": len(entries),
            "total_docs": len(documents),
            "compiled_docs": compiled,
            "pending_docs": pending,
            "compiling_docs": compiling,
            "failed_docs": failed,
            "reviewing": 0,
            "compiling": compiling,
            "failed": failed if task_running and isinstance(trace, dict) and float(trace.get("progress", -2)) < 0 else failed,
        },
        "trace": trace if trace_ok and isinstance(trace, dict) else {},
    }


def _format_pageindex_hit(h: dict[str, Any]) -> dict[str, Any]:
    meta = h.get("metadata") or {}
    return {
        "doc_id": h["doc_id"],
        "doc_name": h["doc_name"],
        "node_id": meta.get("node_id", h["chunk_id"]),
        "node_title": (h["snippet"] or "")[:40] or h["doc_name"],
        "page_range": meta.get("page", ""),
        "confidence": h["score"],
        "excerpt": h["snippet"],
    }


def search_pageindex_library(
    kb_id: str,
    query: str,
    top_k: int = 10,
    *,
    doc_id: str | None = None,
    mode: str | None = None,
) -> dict[str, Any]:
    from rag3.pageindex_hub_service import (
        build_search_steps,
        get_pageindex_settings,
        record_pageindex_search,
    )

    settings = get_pageindex_settings(kb_id)
    effective_mode = (mode or settings.get("search_mode") or "llm_prompt").lower()
    started = time.time()
    hits_raw = search_pageindex_hits(
        kb_id, query, top_k=top_k, doc_id=doc_id, mode=effective_mode,
    )
    latency_ms = max(1, int((time.time() - started) * 1000))
    hits = [_format_pageindex_hit(h) for h in hits_raw]
    hops = 4 if effective_mode == "mcts_hybrid" else 2
    record_pageindex_search(
        kb_id,
        latency_ms=latency_ms,
        mode=effective_mode,
        hops=hops,
        doc_id=doc_id or (hits[0]["doc_id"] if hits else None),
    )
    if doc_id:
        docs_searched = 1
    else:
        all_docs, _ = DocumentService.get_by_kb_id(
            kb_id=kb_id, page_number=0, items_per_page=0, orderby="create_time",
            desc=False, keywords="", run_status=[], types=[], suffix=[],
        )
        docs_searched = sum(1 for d in all_docs if load_pageindex_tree(kb_id, d["id"]))
    step_hits = [
        {
            "node_id": h["node_id"],
            "node_title": h["node_title"],
            "excerpt": h["excerpt"],
        }
        for h in hits
    ]
    return {
        "query": query,
        "mode": effective_mode,
        "hits": hits,
        "total": len(hits),
        "total_ms": latency_ms,
        "docs_searched": docs_searched,
        "steps": build_search_steps(step_hits, effective_mode, latency_ms),
    }


def get_pageindex_hub_analytics(dataset_id: str, tenant_id: str) -> tuple[bool, dict[str, Any] | str]:
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."
    from rag3.pageindex_hub_service import get_pageindex_analytics

    documents, _ = DocumentService.get_by_kb_id(
        kb_id=dataset_id,
        page_number=0,
        items_per_page=0,
        orderby="create_time",
        desc=True,
        keywords="",
        run_status=[],
        types=[],
        suffix=[],
    )
    items = []
    trees: dict[str, dict] = {}
    for doc in documents:
        doc_id = doc["id"]
        tree = load_pageindex_tree(dataset_id, doc_id)
        if tree:
            trees[doc_id] = tree
        items.append({
            "id": doc_id,
            "name": doc.get("name") or doc_id,
            "file_type": doc.get("suffix") or doc.get("type") or "",
            "tree_status": "completed" if tree else "pending",
        })
    return True, get_pageindex_analytics(dataset_id, items, trees)


def search_wiki_library(kb_id: str, query: str, top_k: int = 10) -> dict[str, Any]:
    from rag3.wiki_hub_service import record_wiki_search

    started = time.time()
    hits = search_wiki_hits(kb_id, query, top_k=top_k)
    latency_ms = max(1, int((time.time() - started) * 1000))
    formatted = [
        {
            "id": h.get("entry_id") or h["chunk_id"],
            "title": h.get("title") or h["doc_name"],
            "content": h["snippet"],
            "doc_id": h["doc_id"],
            "doc_name": h["doc_name"],
            "score": h["score"],
        }
        for h in hits
    ]
    record_wiki_search(
        kb_id,
        latency_ms=latency_ms,
        entry_id=formatted[0]["id"] if formatted else None,
    )
    return {
        "query": query,
        "hits": formatted,
        "total": len(formatted),
        "total_ms": latency_ms,
    }


def get_wiki_hub_analytics(dataset_id: str, tenant_id: str) -> tuple[bool, dict[str, Any] | str]:
    if not KnowledgebaseService.accessible(dataset_id, tenant_id):
        return False, "No authorization."
    from rag3.wiki_hub_service import get_wiki_analytics

    ok, payload = list_wiki_hub_entries(dataset_id, tenant_id)
    if not ok or not isinstance(payload, dict):
        return False, payload if isinstance(payload, str) else "Failed to load wiki entries"
    return True, get_wiki_analytics(
        dataset_id,
        payload.get("entries") or [],
        payload.get("source_documents") or [],
    )


def _wiki_query_tokens(query: str) -> list[str]:
    q = (query or "").strip().lower()
    if not q:
        return []
    spaced = [t for t in q.split() if len(t) > 1]
    if spaced:
        return spaced
    if len(q) >= 2:
        return [q] + [q[i : i + 2] for i in range(len(q) - 1)]
    return [q]


def search_wiki_hits(kb_id: str, query: str, top_k: int = 10) -> list[dict[str, Any]]:
    tokens = _wiki_query_tokens(query)
    entries = load_wiki_entries(kb_id)
    hits: list[dict[str, Any]] = []
    for entry in entries:
        title = (entry.get("title") or "").lower()
        content = (entry.get("content") or "").lower()
        text = f"{title} {content}"
        if not tokens:
            score = 0.5
        else:
            matched = sum(1 for tok in tokens if tok in text)
            score = matched / len(tokens)
            if score <= 0:
                continue
        hits.append({
            "chunk_id": entry.get("chunk_id") or entry.get("id"),
            "entry_id": entry.get("id"),
            "title": entry.get("title") or entry.get("doc_name") or "Wiki",
            "doc_id": entry.get("doc_id", "wiki"),
            "doc_name": entry.get("doc_name") or entry.get("title", "Wiki"),
            "score": min(0.99, 0.55 + score * 0.2),
            "snippet": (entry.get("content") or "")[:200],
        })
    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:top_k]

#
# VectifyAI PageIndex SDK 集成（pip install pageindex）
# 云 API：submit_document → 轮询建树 → get_tree；检索走 submit_query / get_retrieval
# 文档：https://docs.pageindex.ai/sdk
#
from __future__ import annotations

import logging
import os
import tempfile
import time
from typing import Any

logger = logging.getLogger(__name__)

PDF_SUFFIXES = frozenset({".pdf"})
POLL_INTERVAL_SEC = 5
POLL_TIMEOUT_SEC = 600
RETRIEVAL_POLL_INTERVAL_SEC = 2
RETRIEVAL_POLL_TIMEOUT_SEC = 120


def get_pageindex_api_key() -> str | None:
    key = (os.environ.get("PAGEINDEX_API_KEY") or "").strip()
    return key or None


def is_pageindex_cloud_enabled() -> bool:
    try:
        from pageindex import PageIndexClient  # noqa: F401
    except ImportError:
        return False
    return get_pageindex_api_key() is not None


def _get_client():
    from pageindex import PageIndexClient

    api_key = get_pageindex_api_key()
    if not api_key:
        raise RuntimeError("PAGEINDEX_API_KEY is not configured")
    return PageIndexClient(api_key=api_key)


def _is_pdf_document(doc_name: str, doc_meta: dict[str, Any] | None = None) -> bool:
    suffix = (doc_meta or {}).get("suffix") or (doc_meta or {}).get("type") or ""
    name = doc_name or ""
    ext = (suffix if suffix.startswith(".") else f".{suffix}").lower() if suffix else ""
    if ext in PDF_SUFFIXES:
        return True
    lower = name.lower()
    return lower.endswith(".pdf")


def _download_document_blob(kb_id: str, doc_id: str) -> tuple[bytes, str] | None:
    from api.db.services.document_service import DocumentService
    from api.db.services.file2document_service import File2DocumentService
    from common import settings

    ok, doc = DocumentService.get_by_id(doc_id)
    if not ok:
        return None
    doc_name = doc.name or doc_id
    try:
        bucket, location = File2DocumentService.get_storage_address(doc_id=doc_id)
        blob = settings.STORAGE_IMPL.get(bucket, location)
        if blob:
            return blob, doc_name
    except Exception:
        logger.exception("pageindex: failed to load blob for doc=%s", doc_id)
    return None


def _normalize_pi_node(raw: dict[str, Any], depth: int = 0) -> dict[str, Any]:
    child_key = None
    for key in ("children", "nodes", "sub_nodes"):
        if isinstance(raw.get(key), list):
            child_key = key
            break
    raw_children = raw.get(child_key) if child_key else []
    children = [_normalize_pi_node(c, depth + 1) for c in raw_children if isinstance(c, dict)]

    title = raw.get("title") or raw.get("name") or "节点"
    summary = raw.get("summary") or raw.get("snippet") or ""
    text = raw.get("text") or ""
    snippet = (summary or text or "")[:200]
    page = raw.get("page_index") or raw.get("start_index") or raw.get("page")

    node: dict[str, Any] = {
        "node_id": str(raw.get("node_id") or raw.get("id") or title),
        "title": str(title),
    }
    if snippet:
        node["snippet"] = snippet
    if page is not None:
        try:
            node["page"] = int(page)
        except (TypeError, ValueError):
            pass
    if children:
        node["children"] = children
    elif text or summary:
        node["chunk_id"] = node["node_id"]
    return node


def normalize_pageindex_tree(
    doc_name: str,
    pi_tree: Any,
    *,
    chunk_count: int = 0,
    pageindex_doc_id: str | None = None,
    source: str = "pageindex_cloud",
) -> dict[str, Any]:
    """将 PageIndex API / 开源结构规范为 RAG3 Hub 使用的 Redis 产物格式。"""
    if isinstance(pi_tree, dict) and "root" in pi_tree:
        root_raw = pi_tree["root"]
    elif isinstance(pi_tree, dict) and ("node_id" in pi_tree or "title" in pi_tree):
        root_raw = pi_tree
    elif isinstance(pi_tree, list) and pi_tree:
        root_raw = {
            "node_id": "root",
            "title": doc_name,
            "children": pi_tree,
        }
    else:
        root_raw = {"node_id": "root", "title": doc_name, "children": []}

    root = _normalize_pi_node(root_raw if isinstance(root_raw, dict) else {"title": doc_name})
    if root.get("node_id") != "root":
        root = {"node_id": "root", "title": doc_name, "children": [root]}

    artifact: dict[str, Any] = {
        "doc_name": doc_name,
        "chunk_count": chunk_count,
        "source": source,
        "root": root,
    }
    if pageindex_doc_id:
        artifact["pageindex_doc_id"] = pageindex_doc_id
    return artifact


def _extract_tree_payload(response: dict[str, Any]) -> Any:
    if not isinstance(response, dict):
        return response
    for key in ("result", "tree", "structure"):
        if key in response and response[key]:
            return response[key]
    return response


def build_pageindex_tree_cloud(
    kb_id: str,
    doc_id: str,
    doc_name: str,
    doc_meta: dict[str, Any] | None = None,
    chunk_count: int = 0,
) -> dict[str, Any] | None:
    """
    使用 PageIndex 云 SDK 对 PDF 建树。
    需配置环境变量 PAGEINDEX_API_KEY；非 PDF 或失败时返回 None 由调用方回退启发式建树。
    """
    if not is_pageindex_cloud_enabled():
        return None
    if not _is_pdf_document(doc_name, doc_meta):
        logger.info("pageindex cloud skipped: %s is not PDF", doc_name)
        return None

    downloaded = _download_document_blob(kb_id, doc_id)
    if not downloaded:
        logger.warning("pageindex cloud: no blob for doc=%s", doc_id)
        return None

    blob, resolved_name = downloaded
    doc_name = resolved_name or doc_name
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(blob)
            tmp_path = tmp.name

        client = _get_client()
        submit = client.submit_document(tmp_path)
        pi_doc_id = submit.get("doc_id") if isinstance(submit, dict) else None
        if not pi_doc_id:
            logger.warning("pageindex cloud: submit_document returned no doc_id for %s", doc_name)
            return None

        deadline = time.time() + POLL_TIMEOUT_SEC
        while time.time() < deadline:
            if client.is_retrieval_ready(pi_doc_id):
                break
            time.sleep(POLL_INTERVAL_SEC)
        else:
            raise TimeoutError(f"PageIndex tree not ready within {POLL_TIMEOUT_SEC}s for {doc_name}")

        tree_resp = client.get_tree(pi_doc_id, node_summary=True)
        pi_tree = _extract_tree_payload(tree_resp)
        return normalize_pageindex_tree(
            doc_name,
            pi_tree,
            chunk_count=chunk_count,
            pageindex_doc_id=pi_doc_id,
            source="pageindex_cloud",
        )
    except Exception:
        logger.exception("pageindex cloud build failed for doc=%s", doc_id)
        return None
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def _flatten_tree_nodes(node: dict[str, Any], acc: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    acc = acc or []
    acc.append(node)
    for child in node.get("children") or []:
        if isinstance(child, dict):
            _flatten_tree_nodes(child, acc)
    return acc


def _load_pageindex_artifact(kb_id: str, doc_id: str) -> dict[str, Any] | None:
    import json

    from rag.utils.redis_conn import REDIS_CONN

    raw = REDIS_CONN.get(f"rag3:artifact:pageindex:{kb_id}:{doc_id}")
    if not raw:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def search_pageindex_cloud(
    kb_id: str,
    query: str,
    top_k: int = 10,
    *,
    doc_id: str | None = None,
    thinking: bool = True,
) -> list[dict[str, Any]]:
    """对已建树且含 pageindex_doc_id 的文档调用 PageIndex 检索 API。"""
    if not is_pageindex_cloud_enabled() or not (query or "").strip():
        return []

    from api.db.services.document_service import DocumentService

    client = _get_client()
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
        tree = _load_pageindex_artifact(kb_id, doc["id"])
        if not tree or tree.get("source") != "pageindex_cloud":
            continue
        pi_doc_id = tree.get("pageindex_doc_id")
        if not pi_doc_id:
            continue
        doc_name = tree.get("doc_name") or doc.get("name", "")

        try:
            submitted = client.submit_query(pi_doc_id, query, thinking=thinking)
            retrieval_id = submitted.get("retrieval_id") if isinstance(submitted, dict) else None
            if not retrieval_id:
                continue

            deadline = time.time() + RETRIEVAL_POLL_TIMEOUT_SEC
            result: dict[str, Any] = {}
            while time.time() < deadline:
                result = client.get_retrieval(retrieval_id)
                status = (result.get("status") or "").lower() if isinstance(result, dict) else ""
                if status in ("completed", "success", "done", "ready"):
                    break
                if status in ("failed", "error"):
                    break
                time.sleep(RETRIEVAL_POLL_INTERVAL_SEC)

            hit_items = []
            if isinstance(result, dict):
                for key in ("nodes", "node_list", "results", "hits"):
                    val = result.get(key)
                    if isinstance(val, list) and val:
                        hit_items = val
                        break
                if not hit_items and result.get("answer"):
                    hit_items = [{"title": "检索结果", "text": result.get("answer"), "score": 0.9}]

            node_map = {n["node_id"]: n for n in _flatten_tree_nodes(tree.get("root") or {})}
            for i, item in enumerate(hit_items[:top_k]):
                if not isinstance(item, dict):
                    continue
                node_id = str(item.get("node_id") or item.get("id") or f"pi-{i}")
                mapped = node_map.get(node_id, {})
                title = item.get("title") or mapped.get("title") or node_id
                snippet = (item.get("text") or item.get("summary") or mapped.get("snippet") or title)[:200]
                score = float(item.get("score") or item.get("confidence") or max(0.85 - i * 0.05, 0.5))
                page_label = mapped.get("page")
                hits.append({
                    "chunk_id": node_id,
                    "doc_id": doc["id"],
                    "doc_name": doc_name,
                    "score": min(0.99, score),
                    "snippet": snippet,
                    "metadata": {
                        "page": f"第 {page_label} 页" if page_label else "",
                        "node_id": node_id,
                        "source": "pageindex_cloud",
                    },
                })
        except Exception:
            logger.exception("pageindex cloud search failed doc=%s", doc["id"])

    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:top_k]

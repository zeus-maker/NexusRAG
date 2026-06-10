#
# RAG3 智能对话 API — /api/v1/conversations/*
#
import json
import logging

from quart import Response, request

from api.apps import current_user, login_required
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.utils.api_utils import get_data_error_result, get_json_result, get_request_json, server_error_response, validate_request
from common.misc_utils import thread_pool_exec
from rag3.chat_service import execute_chat_turn, execute_chat_turn_stream, format_sse
from rag3.conversation_store import (
    append_message,
    create_conversation,
    delete_conversation,
    get_conversation,
    get_settings,
    list_conversations,
    list_messages,
    save_feedback,
    save_settings,
    update_conversation,
)

logger = logging.getLogger(__name__)


async def _validate_kb_ids(kb_ids: list, tenant_id: str) -> str | None:
    if not kb_ids:
        return "kb_ids is required"
    for kb_id in kb_ids:
        ok, kb = await thread_pool_exec(KnowledgebaseService.get_by_id, kb_id)
        if not ok or not kb:
            return f"知识库不存在: {kb_id}"
        if kb.tenant_id != tenant_id:
            return f"无知识库访问权限: {kb_id}"
    return None


def _ensure_conv_owner(conv: dict | None, tenant_id: str) -> str | None:
    if not conv:
        return "对话不存在"
    if conv.get("tenant_id") != tenant_id:
        return "无访问权限"
    return None


@manager.route("/conversations", methods=["POST"])  # noqa: F821
@login_required
@validate_request("kb_ids")
async def create_conv():
    try:
        req = await get_request_json()
        tenant_id = current_user.id
        err = await _validate_kb_ids(req.get("kb_ids") or [], tenant_id)
        if err:
            return get_data_error_result(message=err, code=3001)
        conv = create_conversation(
            tenant_id,
            tenant_id,
            req.get("kb_ids") or [],
            title=req.get("title") or "新对话",
            strategy=req.get("strategy") or "auto",
            model=req.get("model") or "",
            metadata=req.get("metadata"),
        )
        return get_json_result(data=conv)
    except Exception as e:
        logger.exception("create_conv failed")
        return server_error_response(e)


@manager.route("/conversations", methods=["GET"])  # noqa: F821
@login_required
async def list_conv():
    try:
        tenant_id = current_user.id
        search = request.args.get("search") or ""
        convs = list_conversations(tenant_id, tenant_id, search=search)
        return get_json_result(data={"items": convs, "total": len(convs)})
    except Exception as e:
        return server_error_response(e)


@manager.route("/conversations/<conv_id>", methods=["DELETE"])  # noqa: F821
@login_required
async def remove_conv(conv_id):
    try:
        conv = get_conversation(conv_id)
        err = _ensure_conv_owner(conv, current_user.id)
        if err:
            return get_data_error_result(message=err)
        delete_conversation(conv_id)
        return get_json_result(data={"conversation_id": conv_id, "deleted": True})
    except Exception as e:
        return server_error_response(e)


@manager.route("/conversations/<conv_id>", methods=["PATCH"])  # noqa: F821
@login_required
async def patch_conv(conv_id):
    try:
        conv = get_conversation(conv_id)
        err = _ensure_conv_owner(conv, current_user.id)
        if err:
            return get_data_error_result(message=err)
        req = await get_request_json()
        updated = update_conversation(conv_id, req)
        return get_json_result(data=updated)
    except Exception as e:
        return server_error_response(e)


@manager.route("/conversations/<conv_id>/messages", methods=["GET"])  # noqa: F821
@login_required
async def get_messages(conv_id):
    try:
        conv = get_conversation(conv_id)
        err = _ensure_conv_owner(conv, current_user.id)
        if err:
            return get_data_error_result(message=err)
        limit = int(request.args.get("limit") or 50)
        messages = list_messages(conv_id, limit=limit)
        return get_json_result(data={"conversation_id": conv_id, "messages": messages})
    except Exception as e:
        return server_error_response(e)


@manager.route("/conversations/<conv_id>/settings", methods=["GET"])  # noqa: F821
@login_required
async def get_conv_settings(conv_id):
    conv = get_conversation(conv_id)
    err = _ensure_conv_owner(conv, current_user.id)
    if err:
        return get_data_error_result(message=err)
    return get_json_result(data=get_settings(conv_id))


@manager.route("/conversations/<conv_id>/settings", methods=["PUT"])  # noqa: F821
@login_required
async def put_conv_settings(conv_id):
    conv = get_conversation(conv_id)
    err = _ensure_conv_owner(conv, current_user.id)
    if err:
        return get_data_error_result(message=err)
    req = await get_request_json()
    saved = save_settings(conv_id, req if isinstance(req, dict) else {})
    return get_json_result(data=saved)


@manager.route("/conversations/<conv_id>/messages", methods=["POST"])  # noqa: F821
@login_required
async def send_message(conv_id):
    try:
        conv = get_conversation(conv_id)
        err = _ensure_conv_owner(conv, current_user.id)
        if err:
            return get_data_error_result(message=err)

        req = await get_request_json()
        message_text = (req.get("message") or req.get("query") or "").strip()
        if not message_text:
            return get_data_error_result(message="message is required", code=1001)

        stream = bool(req.get("stream", False))
        settings = get_settings(conv_id)
        if isinstance(req.get("settings"), dict):
            settings = save_settings(conv_id, req["settings"])

        kb_id = (conv.get("kb_ids") or [None])[0]
        if not kb_id:
            return get_data_error_result(message="对话未关联知识库")

        history = list_messages(conv_id, limit=int(req.get("context_window") or 20))
        user_msg = append_message(conv_id, {"role": "user", "content": message_text})

        pipeline_ids = req.get("pipeline_ids")
        if stream:
            async def event_stream():
                content_parts: list[str] = []
                citations: list = []
                meta: dict = {}
                try:
                    async for evt in execute_chat_turn_stream(
                        message_text,
                        kb_id,
                        tenant_id=current_user.id,
                        messages=history,
                        settings=settings,
                        pipeline_ids=pipeline_ids,
                    ):
                        if evt["event"] == "token":
                            content_parts.append(evt["data"].get("content") or "")
                        elif evt["event"] == "citation":
                            citations.append(evt["data"])
                        elif evt["event"] == "done":
                            meta = evt["data"]
                        yield format_sse(evt)
                    full_content = "".join(content_parts)
                    assistant = append_message(conv_id, {
                        "role": "assistant",
                        "content": full_content,
                        "citations": citations,
                        "routing_tier": meta.get("routing_tier"),
                        "retrieval_channels": meta.get("retrieval_channels"),
                        "trace": meta.get("trace"),
                        "latency_ms": meta.get("latency_ms"),
                    })
                    yield format_sse({"event": "message_saved", "data": {"message_id": assistant["message_id"]}})
                except Exception as ex:
                    logger.exception("stream failed")
                    yield format_sse({"event": "error", "data": {"message": str(ex)}})

            resp = Response(event_stream(), mimetype="text/event-stream")
            resp.headers.add_header("Cache-Control", "no-cache")
            resp.headers.add_header("Connection", "keep-alive")
            resp.headers.add_header("X-Accel-Buffering", "no")
            return resp

        result = await execute_chat_turn(
            message_text,
            kb_id,
            tenant_id=current_user.id,
            messages=history,
            settings=settings,
            pipeline_ids=pipeline_ids,
        )
        if result.get("error"):
            return get_data_error_result(message=result["error"], code=result.get("code", 500))

        assistant = append_message(conv_id, {
            "role": "assistant",
            "content": result.get("content") or "",
            "citations": result.get("citations") or [],
            "routing_tier": result.get("routing_tier"),
            "retrieval_channels": result.get("retrieval_channels"),
            "confidence": result.get("confidence"),
            "token_usage": result.get("token_usage"),
            "latency_ms": result.get("latency_ms"),
            "trace": result.get("trace"),
        })

        return get_json_result(data={
            "message_id": assistant["message_id"],
            "conversation_id": conv_id,
            "user_message_id": user_msg["message_id"],
            "role": "assistant",
            "content": assistant["content"],
            "citations": assistant["citations"],
            "routing_tier": assistant.get("routing_tier"),
            "retrieval_channels": assistant.get("retrieval_channels"),
            "confidence": result.get("confidence"),
            "token_usage": result.get("token_usage"),
            "latency_ms": result.get("latency_ms"),
            "trace": result.get("trace"),
            "feedback_status": "none",
            "created_at": assistant["created_at"],
        })
    except Exception as e:
        logger.exception("send_message failed")
        return server_error_response(e)


@manager.route("/conversations/<conv_id>/messages/<msg_id>/feedback", methods=["POST"])  # noqa: F821
@login_required
async def message_feedback(conv_id, msg_id):
    conv = get_conversation(conv_id)
    err = _ensure_conv_owner(conv, current_user.id)
    if err:
        return get_data_error_result(message=err)
    req = await get_request_json()
    fb_type = req.get("feedback_type") or req.get("type") or "thumbs_up"
    updated = save_feedback(conv_id, msg_id, fb_type, correction_text=req.get("correction_text") or "")
    if not updated:
        return get_data_error_result(message="消息不存在")
    return get_json_result(data={
        "message_id": msg_id,
        "feedback_type": fb_type,
        "feedback_status": updated.get("feedback_status"),
    })


@manager.route("/conversations/<conv_id>/compare", methods=["POST"])  # noqa: F821
@login_required
async def compare_answers(conv_id):
    conv = get_conversation(conv_id)
    err = _ensure_conv_owner(conv, current_user.id)
    if err:
        return get_data_error_result(message=err)
    req = await get_request_json()
    query = (req.get("message") or req.get("query") or "").strip()
    if not query:
        return get_data_error_result(message="message is required")
    kb_id = (conv.get("kb_ids") or [None])[0]
    settings = get_settings(conv_id)
    strategy_a = req.get("strategy_a") or "precise"
    strategy_b = req.get("strategy_b") or "comprehensive"
    settings_a = {**settings, "strategy": strategy_a}
    settings_b = {**settings, "strategy": strategy_b}
    import asyncio
    a, b = await asyncio.gather(
        execute_chat_turn(query, kb_id, tenant_id=current_user.id, settings=settings_a),
        execute_chat_turn(query, kb_id, tenant_id=current_user.id, settings=settings_b),
    )
    return get_json_result(data={
        "query": query,
        "answer_a": a.get("content"),
        "answer_b": b.get("content"),
        "strategy_a": strategy_a,
        "strategy_b": strategy_b,
        "citations_a": a.get("citations"),
        "citations_b": b.get("citations"),
    })

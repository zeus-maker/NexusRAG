# Devlog — 2026-06-11

> 接续 `docs/devlog/2026-06-07-rag3-frontend.md` §58（系统管理全栈 API 初版）

## 1. 链路追踪增强 + 系统管理剩余 mock 对接

### 背景与目标

在 §58 系统管理 16 页接真实 Admin API 的基础上，用户要求继续完成两项工作：**链路追踪能力增强**（stats/sessions/详情树/OTLP 导出、对话写入 trace_json）以及**尚未对接的 mock 交互**（分类器综合测试、流水线重置、备份恢复、安全投毒队列、融合预览等）。目标是在 `useApiMode()` 为真时，上述页面不再静默回落 mock，且 Trace 页能展示来自 QueryLog 的真实 L1–L5 层与 Span 树。

**用户可见变化**：
- 系统管理 → **链路追踪**：顶部 stats 卡片、Trace/Session 双列表、选中 Trace 拉详情、OTLP JSON 导出；无数据时显示空态而非 mock 样例。
- **查询路由** 综合测试 Tab 调用 `POST /admin/classifier/preview` 返回 tier/路由/fusion。
- **流水线配置**「重置」从 `GET /admin/config/defaults` 拉默认并写回。
- **备份与恢复** 可保存策略、确认恢复走 `POST /admin/maintenance/restore`。
- **安全合规** 投毒队列表格读 `security_rules.poisonQueue`。
- **融合配置** 预览/测试在 API 模式下给出参数摘要与校验反馈。
- **系统监控** 告警恢复/规则启停为会话内状态（v1 未持久化，toast 明示）。

### 改动摘要

**后端**
- `QueryLog.trace_json` JSONField + migrate；`append_log(..., trace_json=)`。
- `conversations_api` 流式/非流式对话结束时 `_merge_trace_payload` 写入 trace + latency。
- `trace_service` 重写：`list_traces`/`get_trace_detail`/`get_trace_stats`/`list_sessions`/`export_otlp`；L1–L5 layers、rootSpan 树、quality 映射。
- `admin_api` 新增 `GET /admin/traces/stats`、`/sessions`、`<id>/export`；list 支持 status/tier；`POST /admin/maintenance/restore`。

**前端**
- `systemService` / `useSystemData`：`getTraceStats`、`listTraceSessions`、`exportTrace`、`fetchTraceDetail`、`triggerRestore`、`getConfigDefaults`。
- `systemMappers`：`mapTraceDetail`、`mapTraceSession`、`getSessionTracesFromList`。
- `TracesPage`：API 模式 stats/sessions/详情/导出；`EMPTY_TRACE` 空态；Langfuse 按钮复制 Trace ID（外链占位）。
- `ClassifierPage` FullTestTab、`PipelineConfigPage` 重置、`SystemOpsPages` Backup、`SystemExtra` Security、`FusionConfigPage`、`MonitorPage` 告警会话态。

### 验证与风险

- 验证：
  - `cd backend/ragflow_rag30 && .venv/bin/python -m py_compile rag3/trace_service.py api/apps/restful_apis/admin_api.py ...` 通过。
  - `cd frontend/rag3-web && npm run build` 通过。
- 手动：API 模式下打开系统管理 → 链路追踪，发起对话后刷新应出现 Trace；导出 OTLP JSON；备份页保存策略/恢复向导提交应返回 AdminJob stub。
- 风险/v1 边界：
  - Langfuse 外链、环境筛选（production/staging）仍前端过滤，后端未写 environment 字段。
  - 监控告警规则/成本导出/索引批量处理仍为演示交互或 mock 图表壳。
  - 恢复/备份/迁移为 AdminJob stub，无真实存储操作。
  - `trace_json` 依赖对话路径写入，历史 QueryLog 无 trace 时详情层为空。

### 反思与沉淀

- Trace 数据流应单一来源：对话 `chat_service._build_trace` → `append_log(trace_json)` → `trace_service` 映射 UI，避免前端再拼 mock 层。
- 「剩余 mock」应分档：**有 API 的必须接**（classifier preview、restore、defaults）；**无 API 的应显式占位**（Langfuse URL、告警持久化），避免 API 模式下仍显示 mock toast。
- 空列表态要用 `EMPTY_TRACE` + 条件渲染详情 Tab，防止 `traceSource[0]` 回落 `TRACE_RECORDS_EXPORT[0]` 造成「假数据」错觉。

### 涉及文件

- `backend/ragflow_rag30/api/db/db_models.py` — QueryLog.trace_json
- `backend/ragflow_rag30/rag3/query_log_service.py` — append_log trace_json
- `backend/ragflow_rag30/api/apps/restful_apis/conversations_api.py` — 对话写 trace
- `backend/ragflow_rag30/rag3/trace_service.py` — Trace 聚合与 OTLP
- `backend/ragflow_rag30/api/apps/restful_apis/admin_api.py` — traces stats/sessions/export、restore
- `frontend/rag3-web/src/pages/TracesPage.tsx` — 链路追踪 API 模式
- `frontend/rag3-web/src/services/systemMappers.ts` — Trace 映射
- `frontend/rag3-web/src/hooks/useSystemData.ts` — trace/roles hooks
- `frontend/rag3-web/src/pages/ClassifierPage.tsx` — 综合测试 preview
- `frontend/rag3-web/src/pages/PipelineConfigPage.tsx` — 重置默认
- `frontend/rag3-web/src/pages/SystemOpsPages.tsx` — 备份策略/恢复
- `frontend/rag3-web/src/pages/SystemExtra.tsx` — 投毒队列 API
- `frontend/rag3-web/src/pages/FusionConfigPage.tsx` — 预览/测试
- `frontend/rag3-web/src/pages/MonitorPage.tsx` — 告警会话态
- `frontend/rag3-web/src/pages/System.tsx` — useAdminRoles 导入修复

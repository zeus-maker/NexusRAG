> 接续 2026-06-10-rag3-frontend.md §7

## 1. 智能对话 AI 回复 Markdown 美化渲染

### 背景与目标

用户反馈 AI 对话回复仍以纯文本/原标签形式展示，仅有 `Chat.tsx` 内简易行级解析（粗体、`- ` 列表），无法渲染标题、代码块、表格、链接等常见 Markdown。目标：正式回答区使用标准 Markdown 渲染，保留引用角标 `[n]` 交互，流式输出时边收边渲染。

### 改动摘要

- 新增依赖 `react-markdown`、`remark-gfm`（GFM 表格、删除线、任务列表等）。
- 新建 `ChatMarkdownContent`：基于 `ReactMarkdown` + `remarkGfm`，为标题/段落/列表/引用/代码块/表格/链接等配置 Tailwind 样式；通过 `injectCitations` 在文本节点内将 `[n]` 渲染为可点击引用按钮，并保留引用详情浮层。
- `Chat.tsx` 移除内联 `MarkdownContent`，助手 `displayAnswer`（经 `parseAssistantContent` 剥离思考链后）统一走 `ChatMarkdownContent`。
- 顺带修复 `thinkContent.ts` 中流式未闭合思考块检测：`indexOf('')` 空串误写导致始终命中索引 0，改为正确检测 7 字符 opening think 标签。

### 验证与风险

- `cd frontend/rag3-web && npm run build` 通过。
- 手动：智能对话 → 发送会返回 Markdown（`#` 标题、\`\`\` 代码块、表格、列表、**粗体**）的问题 → 回答区应格式化展示，非原始符号；带 `[1]` 角标时可点击；Qwen 思考链仍在 `ChatThinkingBlock` 折叠区，不污染回答区。
- 风险：流式过程中未闭合代码块可能短暂样式异常；bundle 增大约 100KB（react-markdown 树）。

### 反思与沉淀

- 引用角标与 Markdown 并存时，不宜预处理替换占位符（易破坏 MD 语法），应在 react-markdown 组件树内递归处理字符串子节点。
- 思考链与回答分离已在 `parseAssistantContent` 完成，Markdown 层无需感知模型标签。

### 涉及文件

- `frontend/rag3-web/package.json` — 新增 markdown 依赖
- `frontend/rag3-web/src/components/ChatMarkdownContent.tsx` — Markdown + 引用渲染组件
- `frontend/rag3-web/src/pages/Chat.tsx` — 接入新组件，删除简易解析
- `frontend/rag3-web/src/utils/thinkContent.ts` — 修复流式 think 开标签检测

---

## 2. 修复思考过程未收纳 Qwen `` 思考内容

### 背景与目标

用户反馈「思考过程」折叠区未包住 think 内容，`` 标签与推理文字泄漏到 Markdown 回答区。根因：`thinkContent.ts` 仅解析 `<think>`，且 `THINK_OPEN` 曾被误写成与 redacted 相同；Qwen 原生 `` 闭合对未被 `extractClosedBlocks` 识别。

### 改动摘要

- 用字符拼接定义 `THINK_OPEN` / `THINK_CLOSE`，避免工具链脱敏导致常量错误。
- 重写解析：`BLOCK_TAGS` 同时支持 redacted 与 think；混用开闭标签；仅闭合标签前缀（`思考</think>回答`）；`findUnclosedBlock` 流式检测未闭合块。
- 导出 `stripThinkingTags`；`ChatThinkingBlock` 展示前剥离残留标签，流式空内容时显示「…」占位。

### 验证与风险

- `npx tsx` 用例：qwen closed/streaming、redacted closed、close-only、mixed tags 均通过。
- `npm run build` 通过。
- 手动：Qwen 推理模型对话 → 思考文字仅在紫色「思考过程」块内，回答区无 `` 标签。

### 涉及文件

- `frontend/rag3-web/src/utils/thinkContent.ts`
- `frontend/rag3-web/src/components/ChatThinkingBlock.tsx`
- `frontend/rag3-web/src/pages/Chat.tsx`

---

## 3. 修复千问 deepseek-r1 推理流「每 token 带闭合标签」导致展示错乱

### 背景与目标

用户抓取 SSE 可见 index 0–71 每个 token 形如 `"，用户</think>"`，前端拼接后思考与回答混杂、Markdown 区出现大量闭合标签。

### 根因分析

1. `chat_model._async_chat_streamly` 对每个 `reasoning_content` delta 执行 `reasoning + "</think>"`。
2. RAGFlow Dialog 用 `_stream_with_think_delta` 清洗；RAG3 `generate_answer_stream` 此前直接透传 raw delta。
3. 前端 `mergeStreamToken` 拼接后得到 `嗯</think>，用户</think>…`，块解析失败。

### 改动摘要

- 后端 `generation_service` 接入 `_stream_with_think_delta`。
- 前端 `normalizeMalformedReasoningStream` 保留最后一个闭合标签为分界，删除中间重复闭合后再解析。

### 验证与风险

- 模拟 token 拼接后 thinking/answer 分离正确；`npm run build` 与 `py_compile` 通过。
- 需重启后端后新 SSE 才走清洗。

### 涉及文件

- `backend/ragflow_rag30/rag3/generation_service.py`
- `frontend/rag3-web/src/utils/thinkContent.ts`

---

## 4. 评测中心对接真实 API（8 Tab）

### 背景与目标

评测中心 UI 已完整但数据来自 `evalMock.ts` / `mockData.ts`，创建/停止等操作为本地 toast。需新建 `evalService` + hooks，在 `useApiMode()` 下接 `/api/v1/eval/*`。

### 改动摘要

- 新建 `evalService.ts`、`evalMappers.ts`、`types/eval.ts`、`useEvalData.ts`（dashboard/runs/datasets/satisfaction/cost/replay/ab/route-learning）。
- `Evaluation.tsx` 三页：仪表盘/任务/A-B 接 API，任务创建传 `dataset_id+kb_id`，running 5s 轮询，失败案例拉 scores。
- `EvalDataset.tsx`：CRUD、multipart 导入、样本增删。
- `EvalSatisfaction.tsx`、`EvalExtra.tsx`（成本+回放）、`EvalRouteLearning.tsx` 接对应端点；mock 模式保留演示。

### 验证与风险

- `npm run build` 通过；需后端重启 + 登录后 `VITE_USE_REAL_API` 冒烟 8 Tab。
- 无数据集时创建任务会提示选择评测集。

### 涉及文件

- `src/services/evalService.ts`、`evalMappers.ts`、`hooks/useEvalData.ts`、`types/eval.ts`
- `src/pages/Evaluation.tsx`、`EvalDataset.tsx`、`EvalSatisfaction.tsx`、`EvalExtra.tsx`、`EvalRouteLearning.tsx`

---

## 5. 修复评测 Tab 切换：mock 数据集 ID 与 scores 缺省

### 背景与目标

后端列表 API 修复后，数据集页仍请求 `/eval/datasets/ds-001/samples`（mock 默认 ID），触发「数据集不存在」；任务页在 `scores` 字段缺失时可能对 `undefined` 调用 `.toFixed()` 崩溃。

### 改动摘要

- `EvalDataset.tsx`：API 模式下 `selectedId` 初始为空，列表加载后自动选中首项或校验已有选中项；样本请求与增删改导入统一走 `activeDatasetId`，不再硬编码 `ds-001`。
- `evalMappers.ts`：`normalizeScores()` 为 faithfulness / recall@10 等六项补 0 默认值；A/B 测试 `p_value` 缺省为 1，避免报告弹窗 `.toFixed` 报错。

### 验证与风险

- `npm run build` 通过；重启后端 + 登录后逐 Tab 切换，数据集页空库应显示空态而非 404 日志。
- Auth 警告 `token=your-token` 来自环境占位符，与本次无关；需配置真实 `VITE_RAGFLOW_AUTH_TOKEN` 或登录态。

### 涉及文件

- `src/pages/EvalDataset.tsx` — 选中数据集与 API 请求对齐
- `src/services/evalMappers.ts` — scores / p_value 归一化

---

## 6. 评测数据集页 CRUD 与导入闭环

### 背景与目标

`EvalDataset.tsx` 此前编辑/删除数据集、编辑样本、知识库选择、JSON 导入、从对话采样均为占位；失败案例「加入数据集」仅 toast。需接满 `evalService` 已有端点。

### 改动摘要

- 新建/编辑数据集：知识库下拉、描述、逗号分隔标签；删除确认；列表展示 KB 名称（从 `useKnowledgeBaseList` 解析）。
- 样本：添加/编辑/删除接 API；`evalService.updateSample` + JSON 导入走 `{samples}` body、CSV 走 multipart。
- 从对话采样弹窗接 `sampleFromChat`；导入须先选中数据集。
- `EvalTasksPage` 失败案例「加入数据集」弹窗选择目标集并调用 `sampleFromChat`。
- `useEvalDatasets` 增加 `tag` 参数传后端筛选。

### 验证与风险

- `npm run build` 通过；冒烟：新建集 → 选 KB → 导入 `docs/example/eval/*.csv` → 编辑样本 → 创建任务。
- 演示模式（`VITE_USE_REAL_API=false`）仍用本地 state，行为与 API 模式分支独立。

### 涉及文件

- `src/pages/EvalDataset.tsx` — 完整 CRUD UI
- `src/pages/Evaluation.tsx` — 失败案例入集
- `src/services/evalService.ts` — updateSample、JSON 导入
- `src/hooks/useEvalData.ts` — tag 筛选

---

## 7. 评测集导入支持拖拽上传

### 背景与目标

导入样本弹窗仅支持点击「选择文件」，与知识库文档上传区体验不一致；用户希望将 `docs/example/eval/*.csv` 拖入即可导入。

### 改动摘要

- `EvalDataset.tsx` 导入区增加 `onDragEnter/Over/Leave/Drop`，拖入高亮、松手即调 `handleImport`；点击区域同样打开文件选择器。
- 导入中显示 `Loader2` 并禁用关闭/重复上传；校验扩展名 `.csv/.json`。

### 验证与风险

- `npm run build` 通过；打开导入弹窗拖入 CSV 应触发与点击选择相同的 API 请求。

### 涉及文件

- `src/pages/EvalDataset.tsx`

---

## 8. 评测任务进度条、ETA 与失败案例对齐所选数据集

### 背景与目标

任务页卡片对所有已完成任务展示全局 mock 失败案例；运行任务无进度；创建弹窗含无效「默认 500 条」单选项。

### 改动摘要

- `EvalRunProgressBar`：展示 progress%、已完成条数、预计剩余时间；仪表盘与任务列表/详情共用。
- API 模式下失败案例仅来自 `useRunScores(detailRunId)`（faithfulness&lt;0.7），移除卡片内 mock Top3。
- 任务展示 `dataset_name`；创建任务默认选中首个 KB/数据集；导出接真实 CSV 下载。
- `mapEvalRun` 映射 progress、completed_cases、eta_seconds、dataset_id/name。

### 验证与风险

- `npm run build` 通过；创建任务选 `docs/example/eval` 对应数据集后，详情失败案例 query 应与 CSV 一致。
- 运行中任务依赖 `useEvalRuns` 5s 轮询刷新 progress。

### 涉及文件

- `src/pages/Evaluation.tsx`
- `src/services/evalMappers.ts`、`evalService.ts`
- `src/hooks/useEvalData.ts`
- `src/types/index.ts`、`types/eval.ts`

---

## 9. 评测任务详情面板增强

### 背景与目标

评测详情弹窗仅展示汇总分数与 Top10 低分案例，缺少检索诊断、全量样本浏览与单条多指标视图；运行中任务无法查看实时进度详情。

### 改动摘要

- 新增 `EvalRunDetailModal`：三 Tab（概览 / 全部样本 / 低分案例）、指标卡片含中文说明与进度条、Faithfulness 分布图、诊断与 `zero_retrieval_cases` 提示、运行中任务可打开并轮询进度。
- 样本行展示 F/AR/CP/R@10 指标芯片与检索片段数；侧栏失败案例抽屉展示完整 `metrics` 对象。
- `useRunScores` 支持 `failuresOnly`、排序、分页参数，返回 `{ items, total, totalCases }`；对接后端 scores 新响应结构。
- 任务卡片/表格支持运行中「详情」；展示 `kb_name`、诊断文案。

### 后端配合

- `GET /eval/runs/{id}/scores` 返回 `{ items, total, total_cases, ... }` 分页元数据。
- `_run_to_api` 补充 `kb_name`。

### 验证与风险

- `npm run build` 通过；`py_compile evaluation_api.py` 通过。
- 打开已完成任务详情 → 概览见分布图 → 全部样本可点单条 → 低分案例 Tab 仅 faithfulness&lt;0.7。
- 旧客户端若仍解析 scores 为数组需同步升级前端。

### 涉及文件

- `src/components/EvalRunDetailModal.tsx`（新建）
- `src/pages/Evaluation.tsx`
- `src/hooks/useEvalData.ts`
- `src/services/evalMappers.ts`、`evalService.ts`
- `src/types/index.ts`、`types/eval.ts`、`data/evalMock.ts`
- `api/apps/restful_apis/evaluation_api.py`

## 10. 失败案例详情：Markdown 渲染与引用新窗口跳转

失败案例侧栏将 `actual`/`expected` 以纯文本展示，Markdown 符号（如 `**标题**`）原样输出；引用片段仅为 `doc · snippet` 字符串，无法跳转知识库分块页。

### 改动摘要

- 后端 `_format_citations` 改为返回结构化对象（`index/doc_id/chunk_id/doc_name/page_number/section/snippet/relevance_score`），与对话 `Citation` 类型对齐，最多 10 条。
- 新增 `EvalFailureCaseDrawer`：`ChatMarkdownContent` 渲染期望/实际答案，答案内 `[n]` 引用可点击；引用列表每条带「新窗口」按钮。
- `citationNavigation.ts` 生成 `#/kb-chunks?kb=&doc=&chunk=` URL，`window.open` 打开分块预览；`navigationUrl`/`store` 增加 `chunk` 参数，`KnowledgeChunkWorkspace` 支持 `initialChunkId` 自动选中分块。
- `mapFailureCase` 映射结构化 citations；mock 数据同步为 `Citation[]`。

### 验证与风险

- `npm run build` 通过；`py_compile evaluation_api.py` 通过。
- 评测任务 → 详情 → 点击低分样本：答案以 Markdown 渲染；引用卡片点击外链图标在新标签打开分块页。
- 分块若不在当前分页，新窗口仍打开文档分块页但不会自动翻页定位（需后续按 chunk_id 反查页码）。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py`
- `src/components/EvalFailureCaseDrawer.tsx`（新建）
- `src/utils/citationNavigation.ts`（新建）
- `src/pages/Evaluation.tsx`、`navigationUrl.ts`、`store.ts`、`App.tsx`
- `src/pages/KnowledgeBase.tsx`、`components/kb/KnowledgeChunkWorkspace.tsx`
- `src/services/evalMappers.ts`、`data/evalMock.ts`

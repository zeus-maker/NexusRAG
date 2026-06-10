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

# Devlog — 2026-06-10

## 1. 启动脚本支持开发热重载

### 背景与目标

本地二开调试需频繁改 `api/`、`rag3/`、`router/` 等 Python 代码，原 `start.sh` 仅冷启动 `ragflow_server.py`，改代码须手动重启。目标：仅改 `scripts/`，复用已有 `--debug` + Quart `use_reloader`，并补齐 task_executor 监听与用法文档。

### 改动摘要

- **start.sh**：新增 `--dev` / `RAGFLOW_DEV=1` 自动传入 `--debug`；修复 `set -u` 下空 `SERVER_ARGS` 展开报错。
- **start-dev.sh**、**dev.sh**：开发快捷入口；`dev.sh` 可联动 API 热重载 + 前端 Vite + 可选 worker。
- **start-task-executor.sh**：`--watch` 轮询 `api/`、`rag3/` 等目录 `.py`/`.yaml` 变更后重启 worker。
- **common.sh**：公共 venv 激活与文件指纹检测。
- **scripts/README.md**：安装、热重载、环境变量、典型终端布局说明。
- **install.sh**：安装完成提示补充新命令。

### 验证与风险

- `bash -n` 各脚本通过；`./start.sh --dev` 不再报 `SERVER_ARGS unbound variable`。
- 手动：`start-dev.sh` 启动后改 `rag3/chat_service.py` 应见 reloader 重启日志。
- 风险：热重载会中断进行中的 SSE/长请求；task_executor `--watch` 为轮询非 inotify，默认 2s 延迟。

### 涉及文件

- `backend/ragflow_rag30/scripts/{common,start,start-dev,dev,start-task-executor,install,README}.md`

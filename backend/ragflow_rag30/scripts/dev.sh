#!/usr/bin/env bash
# 本地开发一键启动：API 热重载 +（可选）task_executor 热重载 + 前端 Vite HMR
#
# 用法:
#   ./scripts/dev.sh                 # API(dev) + 前端
#   ./scripts/dev.sh --with-worker   # 再加 task_executor(watch)
#   ./scripts/dev.sh --api-only      # 仅 API 热重载
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$RAG30_ROOT/../.." && pwd)"
FRONTEND="$REPO_ROOT/frontend/rag3-web"

API_ONLY=0
WITH_WORKER=0

usage() {
  cat <<EOF
用法: $0 [选项]

选项:
  --api-only       仅启动 API（热重载），不启动前端
  --with-worker    同时启动 task_executor（代码变更自动重启）
  -h, --help       显示帮助

说明:
  - API 使用 start-dev.sh（Quart --debug 热重载）
  - 前端使用 Vite HMR（npm run dev）
  - 需已启动 Docker 中间件（MySQL/Redis/ES/MinIO）

示例:
  $0
  $0 --with-worker
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-only) API_ONLY=1; shift ;;
    --with-worker) WITH_WORKER=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage >&2; exit 1 ;;
  esac
done

PIDS=()

cleanup() {
  echo ""
  echo "正在停止开发进程…"
  local pid
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

export RAGFLOW_DEV=1

echo "==> 启动 API（热重载）"
"$SCRIPT_DIR/start-dev.sh" &
PIDS+=($!)

if [[ "$WITH_WORKER" -eq 1 ]]; then
  echo "==> 启动 task_executor（热重载）"
  "$SCRIPT_DIR/start-task-executor.sh" --watch &
  PIDS+=($!)
fi

if [[ "$API_ONLY" -eq 1 ]]; then
  echo "API 已后台运行（PID ${PIDS[0]}），按 Ctrl+C 停止"
  wait
  exit 0
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "==> 安装前端依赖"
  (cd "$FRONTEND" && npm install)
fi

echo "==> 启动前端 Vite（HMR）→ http://localhost:5173"
echo "    代理目标: \${VITE_PROXY_TARGET:-http://localhost:9380}"
cd "$FRONTEND"
npm run dev

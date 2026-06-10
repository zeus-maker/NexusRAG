#!/usr/bin/env bash
# 启动文档解析任务执行器（需与 start.sh 同时运行）
# 热重载：./start-task-executor.sh --watch [worker_id]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

WATCH_MODE=0
WORKER_ID=0

usage() {
  cat <<EOF
用法: $0 [选项] [worker_id]

选项:
  --watch, -w   监听代码变更并自动重启 worker（默认 worker_id=0）
  -h, --help    显示帮助

环境变量:
  RAGFLOW_DEV=1  未指定 worker_id 时默认开启 --watch

示例:
  $0              # worker 0，无热重载
  $0 1            # worker 1
  $0 --watch      # worker 0 + 热重载
  $0 -w 2         # worker 2 + 热重载
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch|-w)
      WATCH_MODE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        WORKER_ID="$1"
      else
        echo "未知参数: $1" >&2
        usage >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ "${RAGFLOW_DEV:-}" == "1" || "${RAGFLOW_DEV:-}" == "true" ]]; then
  WATCH_MODE=1
fi

rag30_activate
export HF_MIRROR="${HF_MIRROR:-https://hf-mirror.com}"

if [[ ! -f "$RAG30_ROOT/rag/res/deepdoc/updown_concat_xgb.model" ]]; then
  echo "警告: 缺少 rag/res/deepdoc/updown_concat_xgb.model，PDF 解析将失败。"
  echo "请运行: $RAG30_ROOT/scripts/download-deepdoc-models.sh"
fi

_run_worker() {
  echo "启动 task_executor worker=$WORKER_ID"
  exec python rag/svr/task_executor.py "$WORKER_ID"
}

if [[ "$WATCH_MODE" -eq 0 ]]; then
  _run_worker
fi

echo "模式: 开发（task_executor 代码变更自动重启）"
trap 'echo "[watch] 停止"; kill 0 2>/dev/null' INT TERM

while true; do
  python rag/svr/task_executor.py "$WORKER_ID" &
  child=$!
  rag30_watch_restart "$RAG30_ROOT" || true
  kill "$child" 2>/dev/null || true
  wait "$child" 2>/dev/null || true
  sleep 0.5
done

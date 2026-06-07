#!/usr/bin/env bash
# 启动文档解析任务执行器（需与 start.sh 同时运行）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV="$RAG30_ROOT/.venv"
WORKER_ID="${1:-0}"

if [[ ! -d "$VENV" ]]; then
  echo "未找到虚拟环境，请先运行: $RAG30_ROOT/scripts/install.sh"
  exit 1
fi

export PYTHONPATH="$RAG30_ROOT"
export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"
export HF_MIRROR="${HF_MIRROR:-https://hf-mirror.com}"

if [[ ! -f "$RAG30_ROOT/rag/res/deepdoc/updown_concat_xgb.model" ]]; then
  echo "警告: 缺少 rag/res/deepdoc/updown_concat_xgb.model，PDF 解析将失败。"
  echo "请运行: $RAG30_ROOT/scripts/download-deepdoc-models.sh"
fi

cd "$RAG30_ROOT"
# shellcheck source=/dev/null
source "$VENV/bin/activate"

echo "启动 task_executor worker=$WORKER_ID"
exec python rag/svr/task_executor.py "$WORKER_ID"

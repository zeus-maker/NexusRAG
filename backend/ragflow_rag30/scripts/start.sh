#!/usr/bin/env bash
# 启动 RAG 3.0 API（ragflow_rag30 源码 + 本地 .venv）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV="$RAG30_ROOT/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "未找到虚拟环境，请先运行: $RAG30_ROOT/scripts/install.sh"
  exit 1
fi

export PYTHONPATH="$RAG30_ROOT"
export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"
export LITELLM_LOCAL_MODEL_COST_MAP="${LITELLM_LOCAL_MODEL_COST_MAP:-True}"

cd "$RAG30_ROOT"
# shellcheck source=/dev/null
source "$VENV/bin/activate"

echo "PYTHONPATH=$PYTHONPATH"
echo "HF_ENDPOINT=$HF_ENDPOINT"
echo "启动 ragflow_server → http://0.0.0.0:9380"
exec python api/ragflow_server.py "$@"

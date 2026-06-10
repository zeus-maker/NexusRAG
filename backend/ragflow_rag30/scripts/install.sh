#!/usr/bin/env bash
# 在 ragflow_rag30 目录用 uv 安装 Python 依赖
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$RAG30_ROOT/../.." && pwd)"
UPSTREAM="${RAGFLOW_UPSTREAM:-$REPO_ROOT/ragflow-0.25.6}"

if [[ ! -f "$RAG30_ROOT/pyproject.toml" ]]; then
  echo "未找到: $RAG30_ROOT/pyproject.toml"
  exit 1
fi

export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"
export UV_HTTP_TIMEOUT="${UV_HTTP_TIMEOUT:-300}"

echo "工作区:      $RAG30_ROOT"
echo "HF_ENDPOINT: $HF_ENDPOINT"
echo ""

cd "$RAG30_ROOT"
uv sync --python 3.13

# download_deps.py 可选：优先本目录，否则回退上游镜像
DEPS_SCRIPT="$RAG30_ROOT/download_deps.py"
if [[ ! -f "$DEPS_SCRIPT" && -f "$UPSTREAM/download_deps.py" ]]; then
  DEPS_SCRIPT="$UPSTREAM/download_deps.py"
  echo "使用上游 download_deps: $DEPS_SCRIPT"
fi
if [[ -f "$DEPS_SCRIPT" ]]; then
  HF_ENDPOINT="$HF_ENDPOINT" uv run python3 "$DEPS_SCRIPT"
else
  echo "跳过 download_deps（未找到脚本）"
fi

# text_concat_xgb 须落在 rag/res/deepdoc（PDF DeepDOC 解析用；download_deps 路径不同）
if [[ -x "$SCRIPT_DIR/download-deepdoc-models.sh" ]]; then
  HF_MIRROR="${HF_MIRROR:-https://hf-mirror.com}" "$SCRIPT_DIR/download-deepdoc-models.sh"
fi

echo ""
echo "安装完成。"
echo "  虚拟环境: $RAG30_ROOT/.venv"
echo "  启动 API:      $RAG30_ROOT/scripts/start.sh"
echo "  开发热重载:    $RAG30_ROOT/scripts/start-dev.sh"
echo "  一键开发:      $RAG30_ROOT/scripts/dev.sh"
echo "  任务执行:      $RAG30_ROOT/scripts/start-task-executor.sh"
echo "  任务热重载:    $RAG30_ROOT/scripts/start-task-executor.sh --watch"

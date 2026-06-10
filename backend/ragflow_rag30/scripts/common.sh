#!/usr/bin/env bash
# ragflow_rag30 启动脚本公共变量与函数（被 start.sh / dev.sh 等 source）

rag30_script_dir() {
  cd "$(dirname "${BASH_SOURCE[1]:-$0}")" && pwd
}

rag30_init_paths() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]:-$0}")" && pwd)"
  RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  VENV="$RAG30_ROOT/.venv"
}

rag30_require_venv() {
  rag30_init_paths
  if [[ ! -d "$VENV" ]]; then
    echo "未找到虚拟环境，请先运行: $RAG30_ROOT/scripts/install.sh"
    exit 1
  fi
}

rag30_activate() {
  rag30_require_venv
  export PYTHONPATH="$RAG30_ROOT"
  export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"
  export LITELLM_LOCAL_MODEL_COST_MAP="${LITELLM_LOCAL_MODEL_COST_MAP:-True}"
  cd "$RAG30_ROOT"
  # shellcheck source=/dev/null
  source "$VENV/bin/activate"
}

# RAG3 二开常改目录（task_executor 监听用）
RAG30_WATCH_PATHS=(
  api
  rag3
  router
  pipelines
  fusion
  security
  common
  conf
  rag/svr
)

rag30_watch_fingerprint() {
  local root="$1"
  local paths=()
  if [[ $# -ge 2 && "$2" != "--" ]]; then
    shift
    paths=("$@")
  else
    paths=("${RAG30_WATCH_PATHS[@]}")
  fi
  local p dir
  for dir in "${paths[@]}"; do
    p="$root/$dir"
    [[ -e "$p" ]] || continue
    if [[ "$(uname -s)" == "Darwin" ]]; then
      find "$p" -type f \( -name '*.py' -o -name '*.yaml' \) ! -path '*/.venv/*' -exec stat -f '%m' {} + 2>/dev/null
    else
      find "$p" -type f \( -name '*.py' -o -name '*.yaml' \) ! -path '*/.venv/*' -exec stat -c '%Y' {} + 2>/dev/null
    fi
  done | sort | shasum -a 256 2>/dev/null | awk '{print $1}'
}

rag30_watch_restart() {
  local root="$1"
  shift
  local interval="${WATCH_INTERVAL:-2}"
  local last fp
  last="$(rag30_watch_fingerprint "$root" "$@")"
  echo "[watch] 监听 Python/YAML 变更，间隔 ${interval}s（Ctrl+C 退出）"
  while true; do
    sleep "$interval"
    fp="$(rag30_watch_fingerprint "$root" "$@")"
    if [[ "$fp" != "$last" ]]; then
      echo "[watch] 检测到变更，重启进程…"
      last="$fp"
      return 0
    fi
  done
}

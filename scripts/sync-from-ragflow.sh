#!/usr/bin/env bash
# 从本地 RAGFlow 上游镜像同步【复用】模块到 backend/ragflow_rag30
# 用法: ./scripts/sync-from-ragflow.sh [--dry-run] api rag deepdoc common conf
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM="${RAGFLOW_UPSTREAM:-$ROOT/ragflow-0.25.6}"
TARGET="$ROOT/backend/ragflow_rag30"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

MODULES=("$@")
if [[ ${#MODULES[@]} -eq 0 ]]; then
  MODULES=(api rag deepdoc agent graphrag common conf)
fi

if [[ ! -d "$UPSTREAM" ]]; then
  echo "上游目录不存在: $UPSTREAM"
  echo "请将 RAGFlow 解压/clone 到 ragflow-0.25.6/ 或设置 RAGFLOW_UPSTREAM"
  exit 1
fi

echo "上游: $UPSTREAM"
echo "目标: $TARGET"
echo "模块: ${MODULES[*]}"
echo ""

# 勿同步的 RAG3 专属包
PROTECTED=(router pipelines fusion security eval observability)

for mod in "${MODULES[@]}"; do
  for p in "${PROTECTED[@]}"; do
    if [[ "$mod" == "$p" ]]; then
      echo "跳过受保护模块: $mod"
      continue 2
    fi
  done
  SRC="$UPSTREAM/$mod"
  DST="$TARGET/$mod"
  if [[ ! -d "$SRC" ]]; then
    echo "WARN: 上游无 $mod"
    continue
  fi
  if $DRY_RUN; then
    echo "[dry-run] rsync -a --delete $SRC/ $DST/"
  else
    echo "同步 $mod ..."
    rsync -a --delete "$SRC/" "$DST/"
  fi
done

echo "完成。请手动检查 RAG3 扩展点（搜索 [RAG3] 标记）。"

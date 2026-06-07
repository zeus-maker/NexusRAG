#!/usr/bin/env bash
# 下载 DeepDOC PDF 解析所需的 text_concat_xgb 模型（首次 PDF 解析必需）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAG30_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="$RAG30_ROOT/rag/res/deepdoc"
MODEL_FILE="$TARGET_DIR/updown_concat_xgb.model"
HF_MIRROR="${HF_MIRROR:-https://hf-mirror.com}"
MODEL_URL="$HF_MIRROR/InfiniFlow/text_concat_xgb_v1.0/resolve/main/updown_concat_xgb.model"

mkdir -p "$TARGET_DIR"

if [[ -f "$MODEL_FILE" ]] && [[ "$(wc -c < "$MODEL_FILE" | tr -d ' ')" -gt 1000000 ]]; then
  echo "已存在: $MODEL_FILE"
  exit 0
fi

echo "下载 DeepDOC 模型 → $MODEL_FILE"
echo "URL: $MODEL_URL"
curl -fL --retry 3 --retry-delay 2 --connect-timeout 30 --max-time 600 \
  -o "$MODEL_FILE" "$MODEL_URL"

if [[ ! -s "$MODEL_FILE" ]]; then
  echo "下载失败或文件为空" >&2
  exit 1
fi

echo "完成: $(ls -lh "$MODEL_FILE" | awk '{print $5}')"

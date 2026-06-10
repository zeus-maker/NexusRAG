/** 推理模型（Qwen 等）输出的思考链标签解析 */

const THINK_OPEN = '<' + 'think' + '>';
const THINK_CLOSE = '<' + '/' + 'think' + '>';
const REDACTED_OPEN = '<think>';
const REDACTED_CLOSE = '</think>';
const TOOL_CALL_RE = /<tool_call>[\s\S]*?<\/tool_call>/g;
const ORPHAN_TAG_RE = /<\/?redacted_thinking>|<\/?think>/gi;

export interface ParsedAssistantContent {
  thinking: string;
  answer: string;
  /** 流式过程中思考块尚未闭合 */
  isThinking: boolean;
}

function stripOrphanTags(text: string): string {
  return (text ?? '').replace(ORPHAN_TAG_RE, '').trim();
}

/** 展示用：移除残留思考标签 */
export function stripThinkingTags(text: string): string {
  return stripOrphanTags(text);
}

/**
 * 修复 Qwen/RAGFlow chat_model 推理流式 bug：每个 reasoning delta 都带 `</think>`，
 * 前端 merge 后变成「嗯</think>，用户</think>…」无法被块解析识别。
 * 保留**最后一个**闭合标签作为思考/回答分界，其余闭合标签视为碎片分隔符删除。
 */
export function normalizeMalformedReasoningStream(text: string): string {
  const raw = text ?? '';
  const closeRe = new RegExp(REDACTED_CLOSE, 'gi');
  const closes = [...raw.matchAll(closeRe)];
  if (closes.length < 2) return raw;

  const lastClose = closes[closes.length - 1];
  const lastIdx = lastClose.index ?? -1;
  if (lastIdx < 0) return raw;

  const thinking = stripOrphanTags(raw.slice(0, lastIdx).replace(closeRe, ''));
  const answer = raw.slice(lastIdx + REDACTED_CLOSE.length);
  if (!thinking) return raw;

  return `${REDACTED_OPEN}${thinking}${REDACTED_CLOSE}${answer}`;
}

type BlockTag = { open: string; close: string };

const BLOCK_TAGS: BlockTag[] = [
  { open: REDACTED_OPEN, close: REDACTED_CLOSE },
  { open: THINK_OPEN, close: THINK_CLOSE },
];

function pushThinking(parts: string[], body: string) {
  const cleaned = stripOrphanTags(body);
  if (cleaned) parts.push(cleaned);
}

function extractClosedBlocks(text: string): { thinking: string; rest: string } {
  const parts: string[] = [];
  let rest = text;

  for (const { open, close } of BLOCK_TAGS) {
    const re = new RegExp(`${open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    rest = rest.replace(re, (_, body: string) => {
      pushThinking(parts, body);
      return '';
    });
  }

  // 混用开闭标签：redacted 开 + think 闭（或反向）
  const mixedPatterns = [
    new RegExp(`${REDACTED_OPEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${THINK_CLOSE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'),
    new RegExp(`${THINK_OPEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${REDACTED_CLOSE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'),
  ];
  for (const re of mixedPatterns) {
    rest = rest.replace(re, (_, body: string) => {
      pushThinking(parts, body);
      return '';
    });
  }

  // 仅有闭合标签：「思考内容</think>回答」
  for (const close of [THINK_CLOSE, REDACTED_CLOSE]) {
    const idx = rest.search(new RegExp(close, 'i'));
    if (idx > 0) {
      pushThinking(parts, rest.slice(0, idx));
      rest = rest.slice(idx + close.length);
      break;
    }
  }

  return { thinking: parts.join('\n\n'), rest };
}

function findUnclosedBlock(text: string): { thinking: string; rest: string } | null {
  let best: { thinking: string; rest: string; openIdx: number } | null = null;

  for (const { open, close } of BLOCK_TAGS) {
    const openRe = new RegExp(open, 'gi');
    let match: RegExpExecArray | null;
    while ((match = openRe.exec(text)) !== null) {
      const openIdx = match.index;
      const afterOpen = text.slice(openIdx + open.length);
      const closeMatch = afterOpen.match(new RegExp(close, 'i'));
      if (closeMatch && closeMatch.index != null) continue;
      if (!best || openIdx > best.openIdx) {
        best = {
          openIdx,
          thinking: afterOpen,
          rest: text.slice(0, openIdx),
        };
      }
    }
  }

  if (!best) return null;
  return {
    thinking: stripOrphanTags(best.thinking),
    rest: stripOrphanTags(best.rest),
  };
}

/** 从助手原文中分离思考链与正式回答 */
export function parseAssistantContent(raw: string, isStreaming = false): ParsedAssistantContent {
  let text = normalizeMalformedReasoningStream((raw ?? '').replace(TOOL_CALL_RE, ''));
  const { thinking: closedThink, rest } = extractClosedBlocks(text);
  text = rest;

  if (isStreaming) {
    const open = findUnclosedBlock(text);
    if (open) {
      const thinking = [closedThink, open.thinking].filter(Boolean).join('\n\n');
      return {
        thinking,
        answer: open.rest,
        isThinking: true,
      };
    }
  }

  const answer = stripOrphanTags(text);
  const hasOpenThink = Boolean(findUnclosedBlock(raw.replace(TOOL_CALL_RE, '')));

  return {
    thinking: closedThink,
    answer,
    isThinking: isStreaming && hasOpenThink,
  };
}

/** 是否仍含未闭合思考标签（用于流式 UI） */
export function hasOpenThinkingBlock(raw: string): boolean {
  return Boolean(findUnclosedBlock((raw ?? '').replace(TOOL_CALL_RE, '')));
}

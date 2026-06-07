import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { DocEnhancementRecord } from '../../data/documentEnhancementStore';
import type { IndexTraceSnapshot } from '../../hooks/useParseQueuePolling';
import type { Document } from '../../types';
import { formatBytes, parseProgressPercent } from '../../utils/documentUtil';

export interface QueueRow {
  doc: Document;
  enhancement?: DocEnhancementRecord;
}

interface StageRow {
  key: string;
  label: string;
  percent: number;
  statusLabel: string;
  statusClass: string;
  log?: string;
  onLog?: () => void;
}

interface Props {
  rows: QueueRow[];
  graphTrace: IndexTraceSnapshot | null;
  raptorTrace: IndexTraceSnapshot | null;
  pageindexTrace: IndexTraceSnapshot | null;
  wikiTrace: IndexTraceSnapshot | null;
  pollCount: number;
  pollIntervalMs: number;
  onRefresh: () => void;
  onOpenDocLog: (doc: Document) => void;
  onOpenIndexLog: (title: string, msg: string) => void;
}

function tracePercent(trace: IndexTraceSnapshot | null | undefined): number {
  if (!trace) return 0;
  if (trace.failed) return 100;
  if (trace.done) return 100;
  if (trace.running && trace.progress >= 0) {
    return Math.min(100, Math.round(trace.progress * 100));
  }
  return 0;
}

function buildIndexStage(
  key: string,
  label: string,
  logTitle: string,
  vectorDone: boolean,
  vectorFailed: boolean,
  triggered: boolean | undefined,
  trace: IndexTraceSnapshot | null,
  activeClass: string,
  onOpenIndexLog: (title: string, msg: string) => void,
): StageRow {
  const pct = vectorDone ? tracePercent(trace) : 0;
  const running = Boolean(trace?.running);
  const failed = Boolean(trace?.failed);
  const done = Boolean(trace?.done);
  return {
    key,
    label,
    percent: vectorDone ? (triggered || running || done || failed ? pct : 5) : 0,
    statusLabel: vectorFailed
      ? '跳过'
      : !vectorDone
        ? '待向量完成'
        : failed
          ? '失败'
          : done
            ? '完成'
            : running
              ? '构建中'
              : triggered
                ? '排队中'
                : '待触发',
    statusClass: failed
      ? 'bg-red-100 text-red-700'
      : done
        ? 'bg-green-100 text-green-700'
        : running || triggered
          ? activeClass
          : 'bg-gray-100 text-gray-600',
    log: trace?.progress_msg,
    onLog: trace?.progress_msg
      ? () => onOpenIndexLog(logTitle, trace.progress_msg)
      : undefined,
  };
}

function buildStages(
  doc: Document,
  enhancement: DocEnhancementRecord | undefined,
  graphTrace: IndexTraceSnapshot | null,
  raptorTrace: IndexTraceSnapshot | null,
  pageindexTrace: IndexTraceSnapshot | null,
  wikiTrace: IndexTraceSnapshot | null,
  onOpenDocLog: (doc: Document) => void,
  onOpenIndexLog: (title: string, msg: string) => void,
): StageRow[] {
  const vectorPct = parseProgressPercent(doc.progress, doc.parse_status);
  const vectorDone = doc.parse_status === 'parsed';
  const vectorFailed = doc.parse_status === 'failed';
  const vectorRunning = doc.parse_status === 'parsing' || doc.parse_status === 'pending';

  const cfg = enhancement?.config;
  const stages: StageRow[] = [
    {
      key: 'vector',
      label: '向量解析',
      percent: vectorPct,
      statusLabel: vectorFailed ? '失败' : vectorDone ? '完成' : vectorRunning ? '进行中' : '等待',
      statusClass: vectorFailed
        ? 'bg-red-100 text-red-700'
        : vectorDone
          ? 'bg-green-100 text-green-700'
          : vectorRunning
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600',
      log: doc.progress_msg,
      onLog: doc.progress_msg ? () => onOpenDocLog(doc) : undefined,
    },
  ];

  const triggered = enhancement?.indexTriggered;

  if (cfg?.enablePageIndex) {
    stages.push(buildIndexStage(
      'pageindex', 'PageIndex', 'PageIndex 构建',
      vectorDone, vectorFailed, triggered, pageindexTrace,
      'bg-purple-100 text-purple-700', onOpenIndexLog,
    ));
  }

  if (cfg?.enableWiki) {
    stages.push(buildIndexStage(
      'wiki', 'LLM Wiki', 'LLM Wiki 编译',
      vectorDone, vectorFailed, triggered, wikiTrace,
      'bg-amber-100 text-amber-800', onOpenIndexLog,
    ));
  }

  if (cfg?.enableGraphRag) {
    stages.push(buildIndexStage(
      'graph', '知识图谱', '知识图谱 GraphRAG',
      vectorDone, vectorFailed, triggered, graphTrace,
      'bg-indigo-100 text-indigo-700', onOpenIndexLog,
    ));
  }

  if (cfg?.enableRaptor) {
    stages.push(buildIndexStage(
      'raptor', 'RAPTOR', 'RAPTOR',
      vectorDone, vectorFailed, triggered, raptorTrace,
      'bg-cyan-100 text-cyan-800', onOpenIndexLog,
    ));
  }

  return stages;
}

function StageProgressBar({ percent, active }: { percent: number; active: boolean }) {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-blue-500' : 'bg-green-500'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function DocumentParseQueuePanel({
  rows,
  graphTrace,
  raptorTrace,
  pageindexTrace,
  wikiTrace,
  pollCount,
  pollIntervalMs,
  onRefresh,
  onOpenDocLog,
  onOpenIndexLog,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map(r => [r.doc.doc_id, true])),
  );

  const activeCount = rows.filter(r => {
    const st = r.doc.parse_status;
    return st === 'parsing' || st === 'pending'
      || (r.enhancement && !r.enhancement.indexTriggered && st === 'parsed')
      || graphTrace?.running
      || raptorTrace?.running;
  }).length;

  if (!rows.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          解析队列 ({activeCount}/{rows.length})
        </span>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>每 {pollIntervalMs / 1000}s 刷新 · 第 {pollCount} 次</span>
          <button type="button" onClick={onRefresh} className="text-cyan-600 hover:underline">
            立即刷新
          </button>
        </div>
      </div>

      {rows.map(({ doc, enhancement }) => {
        const isOpen = expanded[doc.doc_id] !== false;
        const stages = buildStages(
          doc,
          enhancement,
          graphTrace,
          raptorTrace,
          pageindexTrace,
          wikiTrace,
          onOpenDocLog,
          onOpenIndexLog,
        );
        const overallPct = Math.round(
          stages.reduce((s, st) => s + st.percent, 0) / Math.max(stages.length, 1),
        );

        return (
          <div
            key={doc.doc_id}
            className="border-b border-gray-50 dark:border-gray-800 last:border-0"
          >
            <button
              type="button"
              className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
              onClick={() => setExpanded(prev => ({ ...prev, [doc.doc_id]: !isOpen }))}
            >
              {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
              <FileText size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{doc.original_name}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{formatBytes(doc.file_size)}</span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 w-8 text-right flex-shrink-0">{overallPct}%</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 pl-10 space-y-2">
                {stages.map(stage => (
                  <div key={stage.key} className="flex items-center gap-2 text-[11px]">
                    <span className="w-20 text-gray-500 flex-shrink-0">{stage.label}</span>
                    <div className="flex-1 min-w-0">
                      <StageProgressBar
                        percent={stage.percent}
                        active={stage.statusLabel === '进行中' || stage.statusLabel === '构建中'}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500 flex-shrink-0">{stage.percent}%</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${stage.statusClass}`}>
                      {stage.statusLabel}
                    </span>
                    {stage.onLog && (
                      <button
                        type="button"
                        onClick={stage.onLog}
                        className="text-[10px] text-cyan-600 hover:underline flex-shrink-0"
                      >
                        日志
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getBatchDocIds,
  listEnhancementsForKb,
  markBatchIndexTriggered,
  pruneEnhancements,
} from '../data/documentEnhancementStore';
import type { Document } from '../types';
import { kbApi } from '../services/kbApi';
import { syncKbParserConfigFromUpload, triggerKbEnhancementIndexes } from './useKbData';

export interface IndexTraceSnapshot {
  progress: number;
  progress_msg: string;
  process_duration?: number;
  running: boolean;
  failed: boolean;
  done: boolean;
}

export interface ParseQueuePollingState {
  graphTrace: IndexTraceSnapshot | null;
  raptorTrace: IndexTraceSnapshot | null;
  pageindexTrace: IndexTraceSnapshot | null;
  wikiTrace: IndexTraceSnapshot | null;
  pollCount: number;
  lastRefreshedAt: number | null;
}

const POLL_MS = 3000;

function normalizeTrace(raw: Record<string, unknown> | null | undefined): IndexTraceSnapshot | null {
  if (!raw || typeof raw !== 'object' || !Object.keys(raw).length) return null;
  const progressRaw = raw.progress;
  const progress = typeof progressRaw === 'number' ? progressRaw : -2;
  return {
    progress,
    progress_msg: typeof raw.progress_msg === 'string' ? raw.progress_msg : '',
    process_duration: typeof raw.process_duration === 'number' ? raw.process_duration : undefined,
    running: progress >= 0 && progress < 1,
    failed: progress < 0,
    done: progress >= 1,
  };
}

function batchReadyForIndex(
  kbId: string,
  batchId: string,
  documents: Document[],
): boolean {
  const ids = getBatchDocIds(kbId, batchId);
  if (!ids.length) return false;
  const byId = new Map(documents.map(d => [d.doc_id, d]));
  return ids.every(id => {
    const doc = byId.get(id);
    return doc && (doc.parse_status === 'parsed' || doc.parse_status === 'failed');
  });
}

export function useParseQueuePolling(
  kbId: string,
  documents: Document[],
  refreshDocs: () => void,
  enabled: boolean,
) {
  const [state, setState] = useState<ParseQueuePollingState>({
    graphTrace: null,
    raptorTrace: null,
    pageindexTrace: null,
    wikiTrace: null,
    pollCount: 0,
    lastRefreshedAt: null,
  });
  const triggeringRef = useRef<Set<string>>(new Set());
  const documentsRef = useRef(documents);
  const tracesRef = useRef({
    graph: null as IndexTraceSnapshot | null,
    raptor: null as IndexTraceSnapshot | null,
    pageindex: null as IndexTraceSnapshot | null,
    wiki: null as IndexTraceSnapshot | null,
  });

  documentsRef.current = documents;
  tracesRef.current = {
    graph: state.graphTrace,
    raptor: state.raptorTrace,
    pageindex: state.pageindexTrace,
    wiki: state.wikiTrace,
  };

  const pollOnce = useCallback(async () => {
    refreshDocs();
    const docs = documentsRef.current;
    const enhancements = listEnhancementsForKb(kbId);

    const needsGraph = enhancements.some(e => e.config.enableGraphRag);
    const needsRaptor = enhancements.some(e => e.config.enableRaptor);
    const needsPageIndex = enhancements.some(e => e.config.enablePageIndex);
    const needsWiki = enhancements.some(e => e.config.enableWiki);

    let graphTrace = tracesRef.current.graph;
    let raptorTrace = tracesRef.current.raptor;
    let pageindexTrace = tracesRef.current.pageindex;
    let wikiTrace = tracesRef.current.wiki;

    if (needsGraph || graphTrace?.running) {
      try {
        graphTrace = normalizeTrace(await kbApi.traceIndex(kbId, 'graph'));
      } catch { /* keep */ }
    }
    if (needsRaptor || raptorTrace?.running) {
      try {
        raptorTrace = normalizeTrace(await kbApi.traceIndex(kbId, 'raptor'));
      } catch { /* keep */ }
    }
    if (needsPageIndex || pageindexTrace?.running) {
      try {
        pageindexTrace = normalizeTrace(await kbApi.traceRag3Index(kbId, 'pageindex'));
      } catch { /* keep */ }
    }
    if (needsWiki || wikiTrace?.running) {
      try {
        wikiTrace = normalizeTrace(await kbApi.traceRag3Index(kbId, 'wiki'));
      } catch { /* keep */ }
    }

    const batches = new Set(enhancements.filter(e => !e.indexTriggered).map(e => e.batchId));
    for (const batchId of batches) {
      if (!batchReadyForIndex(kbId, batchId, docs)) continue;
      const sample = enhancements.find(e => e.batchId === batchId);
      if (!sample) continue;
      const lockKey = `${kbId}:${batchId}`;
      if (triggeringRef.current.has(lockKey)) continue;
      triggeringRef.current.add(lockKey);
      try {
        const parsedIds = getBatchDocIds(kbId, batchId).filter(id => {
          const doc = docs.find(d => d.doc_id === id);
          return doc?.parse_status === 'parsed';
        });
        if (parsedIds.length) {
          await syncKbParserConfigFromUpload(kbId, sample.config);
          await triggerKbEnhancementIndexes(kbId, sample.config, parsedIds);
        }
        markBatchIndexTriggered(kbId, batchId);
      } catch {
        markBatchIndexTriggered(kbId, batchId);
      } finally {
        triggeringRef.current.delete(lockKey);
      }
    }

    const terminal = new Map(docs.map(d => [d.doc_id, d.parse_status]));
    pruneEnhancements(kbId, new Set(docs.map(d => d.doc_id)), terminal);

    setState(prev => ({
      graphTrace: graphTrace ?? prev.graphTrace,
      raptorTrace: raptorTrace ?? prev.raptorTrace,
      pageindexTrace: pageindexTrace ?? prev.pageindexTrace,
      wikiTrace: wikiTrace ?? prev.wikiTrace,
      pollCount: prev.pollCount + 1,
      lastRefreshedAt: Date.now(),
    }));
  }, [kbId, refreshDocs]);

  const shouldPoll = enabled && (
    documents.some(d => d.parse_status === 'parsing' || d.parse_status === 'pending')
    || listEnhancementsForKb(kbId).some(e => !e.indexTriggered)
    || state.graphTrace?.running
    || state.raptorTrace?.running
    || state.pageindexTrace?.running
    || state.wikiTrace?.running
  );

  useEffect(() => {
    if (!shouldPoll) return;
    void pollOnce();
    const timer = window.setInterval(() => void pollOnce(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPoll, pollOnce]);

  return { ...state, pollIntervalMs: POLL_MS };
}

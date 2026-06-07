import type { DocumentUploadConfig } from './documentUploadConfig';

export interface DocEnhancementRecord {
  docId: string;
  kbId: string;
  batchId: string;
  config: DocumentUploadConfig;
  indexTriggered: boolean;
  createdAt: number;
}

const records = new Map<string, DocEnhancementRecord>();
const batchDocs = new Map<string, Set<string>>();

function batchKey(kbId: string, batchId: string) {
  return `${kbId}:${batchId}`;
}

export function registerDocEnhancements(
  kbId: string,
  docIds: string[],
  config: DocumentUploadConfig,
  batchId = `batch-${Date.now()}`,
) {
  const key = batchKey(kbId, batchId);
  const set = new Set(docIds);
  batchDocs.set(key, set);
  for (const docId of docIds) {
    records.set(docId, {
      docId,
      kbId,
      batchId,
      config,
      indexTriggered: false,
      createdAt: Date.now(),
    });
  }
  return batchId;
}

export function getDocEnhancement(docId: string): DocEnhancementRecord | undefined {
  return records.get(docId);
}

export function listEnhancementsForKb(kbId: string): DocEnhancementRecord[] {
  return [...records.values()].filter(r => r.kbId === kbId);
}

export function getBatchDocIds(kbId: string, batchId: string): string[] {
  return [...(batchDocs.get(batchKey(kbId, batchId)) ?? [])];
}

export function markBatchIndexTriggered(kbId: string, batchId: string) {
  const ids = getBatchDocIds(kbId, batchId);
  for (const docId of ids) {
    const rec = records.get(docId);
    if (rec) records.set(docId, { ...rec, indexTriggered: true });
  }
}

export function pruneEnhancements(
  kbId: string,
  docIds: Set<string>,
  terminalStatuses: Map<string, string>,
) {
  for (const [docId, rec] of records) {
    if (rec.kbId !== kbId) continue;
    if (!docIds.has(docId)) continue;
    const st = terminalStatuses.get(docId);
    if (rec.indexTriggered && (st === 'parsed' || st === 'failed')) {
      const batchKeyStr = batchKey(rec.kbId, rec.batchId);
      const batch = batchDocs.get(batchKeyStr);
      if (batch) {
        batch.delete(docId);
        if (batch.size === 0) batchDocs.delete(batchKeyStr);
      }
      records.delete(docId);
    }
  }
}

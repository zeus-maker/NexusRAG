export interface RecycleBinItem {
  id: string;
  name: string;
  type: '知识库' | '文档';
  kb: string;
  kbId?: string;
  deletedAt: string;
  daysLeft: number;
  deletedBy: string;
  sizeBytes?: number;
  fileType?: string;
  docCount?: number;
}

export const INITIAL_RECYCLE_BIN: RecycleBinItem[] = [
  { id: 'rb-1', name: '供应商合同V4.pdf', type: '文档', kb: '法务合同知识库', kbId: 'kb-001', deletedAt: '2026-06-04T14:20:00Z', daysLeft: 28, deletedBy: '张伟', sizeBytes: 2411724, fileType: 'PDF' },
  { id: 'rb-2', name: '旧版合规政策库', type: '知识库', kb: '—', deletedAt: '2026-06-02T09:15:00Z', daysLeft: 26, deletedBy: '李婷', docCount: 45 },
  { id: 'rb-3', name: '财务Q1报告.docx', type: '文档', kb: '财务报告知识库', kbId: 'kb-002', deletedAt: '2026-05-28T10:00:00Z', daysLeft: 22, deletedBy: '王芳', sizeBytes: 1048576, fileType: 'DOCX' },
  { id: 'rb-4', name: '扫描件合同.pdf', type: '文档', kb: '法务合同知识库', kbId: 'kb-001', deletedAt: '2026-06-05T08:00:00Z', daysLeft: 29, deletedBy: '陈工', sizeBytes: 8388608, fileType: 'PDF' },
  { id: 'rb-5', name: '2023培训资料库', type: '知识库', kb: '—', deletedAt: '2026-05-20T16:00:00Z', daysLeft: 14, deletedBy: '李婷', docCount: 78 },
  { id: 'rb-6', name: '竞品分析草稿.pptx', type: '文档', kb: '研发技术文档库', kbId: 'kb-003', deletedAt: '2026-06-01T11:30:00Z', daysLeft: 25, deletedBy: '陈工', sizeBytes: 5242880, fileType: 'PPTX' },
  { id: 'rb-7', name: '临时测试知识库', type: '知识库', kb: '—', deletedAt: '2026-06-05T22:00:00Z', daysLeft: 29, deletedBy: '王芳', docCount: 3 },
  { id: 'rb-8', name: '旧版员工手册.pdf', type: '文档', kb: '培训材料知识库', kbId: 'kb-005', deletedAt: '2026-05-15T09:00:00Z', daysLeft: 5, deletedBy: '张伟', sizeBytes: 3145728, fileType: 'PDF' },
];

let recycleBinState: RecycleBinItem[] = [...INITIAL_RECYCLE_BIN];

export function getRecycleBinItems(): RecycleBinItem[] {
  return recycleBinState;
}

export function setRecycleBinItems(items: RecycleBinItem[]) {
  recycleBinState = items;
}

export function addToRecycleBin(item: RecycleBinItem) {
  recycleBinState = [item, ...recycleBinState];
}

export function getRecycleBinCount(): number {
  return recycleBinState.length;
}

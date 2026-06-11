import type { Citation } from '../types';
import { appStateToHash, type NavLocationState } from '../navigationUrl';

export function buildCitationPreviewUrl(
  kbId: string,
  citation: Pick<Citation, 'doc_id' | 'chunk_id'>,
): string | null {
  if (!kbId || !citation.doc_id) return null;
  const state: NavLocationState = {
    page: 'kb-chunks',
    selectedKBId: kbId,
    selectedDocId: citation.doc_id,
    selectedChunkId: citation.chunk_id || undefined,
  };
  if (typeof window === 'undefined') return appStateToHash(state);
  return `${window.location.origin}${window.location.pathname}${window.location.search}${appStateToHash(state)}`;
}

export function openCitationPreview(kbId: string, citation: Citation): void {
  const url = buildCitationPreviewUrl(kbId, citation);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

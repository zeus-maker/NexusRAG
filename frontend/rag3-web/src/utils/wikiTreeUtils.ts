import type { WikiPage, WikiSourceDoc, WikiTreeNode } from '../data/wikiMock';

/** 由 API 返回的 Wiki 条目构建左侧目录树 */
export function buildWikiTreeFromPages(pages: WikiPage[], sourceDocs: WikiSourceDoc[]): WikiTreeNode {
  const compiledDocs = sourceDocs.filter(d => d.wikiPageCount > 0 || d.ingestStatus === 'compiled');
  const children: WikiTreeNode[] = [];

  for (const doc of compiledDocs) {
    const docPages = pages.filter(
      p => p.sources.includes(doc.id)
        || (p.rawSource && p.rawSource.includes(doc.name))
        || doc.relatedSlugs.includes(p.slug),
    );
    if (!docPages.length) continue;
    children.push({
      id: `folder-${doc.id}`,
      title: doc.name,
      nodeType: 'folder',
      pageType: 'raw',
      children: docPages.map(p => ({
        id: p.id,
        title: p.title,
        nodeType: 'page' as const,
        pageType: p.pageType,
        slug: p.slug,
        status: p.status,
        citeRate: p.citeRate,
      })),
    });
  }

  const assigned = new Set(children.flatMap(f => (f.children ?? []).map(c => c.id)));
  const orphanPages = pages.filter(p => !assigned.has(p.id));
  if (orphanPages.length) {
    children.push({
      id: 'folder-other',
      title: '其他条目',
      nodeType: 'folder',
      pageType: 'entity',
      children: orphanPages.map(p => ({
        id: p.id,
        title: p.title,
        nodeType: 'page' as const,
        pageType: p.pageType,
        slug: p.slug,
        status: p.status,
        citeRate: p.citeRate,
      })),
    });
  }

  return {
    id: 'root',
    title: 'index.md',
    nodeType: 'folder',
    pageType: 'index',
    slug: 'wiki-index',
    children,
  };
}

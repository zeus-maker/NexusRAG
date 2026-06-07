import type { PageIndexTreeNode } from '../data/pageIndexMock';

export function findTreeNode(node: PageIndexTreeNode, id: string): PageIndexTreeNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findTreeNode(child, id);
    if (found) return found;
  }
  return undefined;
}

/** 返回从根到目标节点（不含目标）的祖先 id，用于自动展开树路径 */
export function findTreeNodeAncestorIds(node: PageIndexTreeNode, targetId: string, acc: string[] = []): string[] | null {
  if (node.id === targetId) return acc;
  for (const child of node.children ?? []) {
    const found = findTreeNodeAncestorIds(child, targetId, [...acc, node.id]);
    if (found) return found;
  }
  return null;
}

export function countTreeDepth(node: PageIndexTreeNode): number {
  const children = node.children ?? [];
  if (!children.length) return 1;
  return 1 + Math.max(...children.map(countTreeDepth));
}

export function countTreeNodes(node: PageIndexTreeNode): number {
  return 1 + (node.children ?? []).reduce((sum, c) => sum + countTreeNodes(c), 0);
}

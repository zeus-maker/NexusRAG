import { apiRequest, apiUpload } from './http';
import {
  mapCreateFormToPayload,
  mapDatasetToKB,
  mapDocumentToUI,
  sortKeyToOrderby,
  type RagflowDataset,
  type RagflowDocument,
} from './kbMappers';
import type { KBCreateForm } from '../components/KBCreateDialog';
import type { Document, KnowledgeBase } from '../types';

export interface ListKbParams {
  page?: number;
  page_size?: number;
  name?: string;
  orderby?: string;
  desc?: boolean;
}

export interface ListKbResult {
  items: KnowledgeBase[];
  total: number;
}

export interface ListDocParams {
  page?: number;
  page_size?: number;
  keywords?: string;
  orderby?: string;
  desc?: boolean;
}

export interface ListDocResult {
  items: Document[];
  total: number;
}

export const kbApi = {
  /** GET /datasets */
  async list(params: ListKbParams = {}): Promise<ListKbResult> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.name) qs.set('name', params.name);
    if (params.orderby) qs.set('orderby', params.orderby);
    if (params.desc !== undefined) qs.set('desc', String(params.desc));
    const query = qs.toString();
    const { data, total } = await apiRequest<RagflowDataset[]>(
      `/datasets${query ? `?${query}` : ''}`,
    );
    const list = Array.isArray(data) ? data : [];
    return {
      items: list.map(mapDatasetToKB),
      total: total ?? list.length,
    };
  },

  /** GET /datasets/:id */
  async get(datasetId: string): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`);
    return mapDatasetToKB(data);
  },

  /** POST /datasets */
  async create(form: KBCreateForm): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(mapCreateFormToPayload(form)),
    });
    return mapDatasetToKB(data);
  },

  /** PUT /datasets/:id */
  async update(datasetId: string, patch: Partial<{ name: string; description: string }>): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return mapDatasetToKB(data);
  },

  /** DELETE /datasets */
  async delete(ids: string[]): Promise<void> {
    await apiRequest('/datasets', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },

  /** GET /datasets/:id/documents */
  async listDocuments(datasetId: string, params: ListDocParams = {}): Promise<ListDocResult> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.keywords) qs.set('keywords', params.keywords);
    if (params.orderby) qs.set('orderby', params.orderby);
    if (params.desc !== undefined) qs.set('desc', String(params.desc));
    const query = qs.toString();
    const { data } = await apiRequest<{ docs: RagflowDocument[]; total: number }>(
      `/datasets/${datasetId}/documents${query ? `?${query}` : ''}`,
    );
    const docs = data?.docs ?? [];
    return {
      items: docs.map(d => mapDocumentToUI(d, datasetId)),
      total: data?.total ?? docs.length,
    };
  },

  /** POST /datasets/:id/documents (multipart) */
  async uploadDocuments(datasetId: string, files: File[]): Promise<Document[]> {
    const form = new FormData();
    files.forEach(f => form.append('file', f));
    const data = await apiUpload<RagflowDocument[] | RagflowDocument>(
      `/datasets/${datasetId}/documents`,
      form,
    );
    const list = Array.isArray(data) ? data : [data];
    return list.map(d => mapDocumentToUI(d, datasetId));
  },

  /** 便捷：带排序的列表查询 */
  async listSorted(
    sortBy: string,
    desc: boolean,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<ListKbResult> {
    return kbApi.list({
      page,
      page_size: pageSize,
      name: search.trim() || undefined,
      orderby: sortKeyToOrderby(sortBy),
      desc,
    });
  },
};

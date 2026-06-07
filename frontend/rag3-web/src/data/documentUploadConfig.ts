/** 文档上传/解析配置（对齐 RAGFlow chunk_method + parser_config，扩展 RAG3 增强索引） */

export interface ChunkMethodOption {
  value: string;
  label: string;
  hint?: string;
}

export const CHUNK_METHOD_OPTIONS: ChunkMethodOption[] = [
  { value: 'naive', label: 'General（通用）', hint: 'DeepDOC 版面识别 + 通用分块' },
  { value: 'qa', label: 'Q&A（问答对）', hint: '适合 FAQ、问答文档' },
  { value: 'manual', label: 'Manual（手册）', hint: '层级标题与手册结构' },
  { value: 'table', label: 'Table（表格）', hint: '表格优先解析' },
  { value: 'paper', label: 'Paper（论文）', hint: '学术论文结构' },
  { value: 'book', label: 'Book（书籍）', hint: '书籍章节分块' },
  { value: 'laws', label: 'Laws（法律）', hint: '法条层级分块' },
  { value: 'presentation', label: 'Presentation（演示）', hint: 'PPT/PPTX 专用' },
  { value: 'one', label: 'One（整篇）', hint: '单 chunk 整文档' },
  { value: 'knowledge_graph', label: 'Knowledge Graph', hint: '图谱导向分块' },
];

const LABEL_TO_METHOD: Record<string, string> = {
  '通用分块': 'naive',
  'Laws（法律）': 'laws',
  '表格优先': 'table',
  '代码感知': 'naive',
  '书籍分块': 'book',
};

export interface DocumentUploadConfig {
  chunkMethod: string;
  chunkTokenNum: number;
  delimiter: string;
  layoutRecognize: string;
  enableGraphRag: boolean;
  graphRagMethod: 'light' | 'general' | 'ner';
  enableRaptor: boolean;
  enablePageIndex: boolean;
  enableWiki: boolean;
  autoParse: boolean;
}

export const DEFAULT_UPLOAD_CONFIG: DocumentUploadConfig = {
  chunkMethod: 'naive',
  chunkTokenNum: 512,
  delimiter: '\\n',
  layoutRecognize: 'DeepDOC',
  enableGraphRag: false,
  graphRagMethod: 'light',
  enableRaptor: false,
  enablePageIndex: true,
  enableWiki: false,
  autoParse: true,
};

export interface DatasetParserDefaults {
  chunkMethod?: string;
  parserConfig?: Record<string, unknown>;
}

export function chunkMethodFromKbStrategy(strategy?: string): string {
  if (!strategy) return 'naive';
  return LABEL_TO_METHOD[strategy] || 'naive';
}

export function configFromDatasetDefaults(defaults?: DatasetParserDefaults): DocumentUploadConfig {
  const base = { ...DEFAULT_UPLOAD_CONFIG };
  if (defaults?.chunkMethod) {
    base.chunkMethod = defaults.chunkMethod;
  }
  const pc = defaults?.parserConfig;
  if (!pc || typeof pc !== 'object') return base;

  if (typeof pc.chunk_token_num === 'number') base.chunkTokenNum = pc.chunk_token_num;
  if (typeof pc.delimiter === 'string') base.delimiter = pc.delimiter;
  if (typeof pc.layout_recognize === 'string') base.layoutRecognize = pc.layout_recognize;

  const graphrag = pc.graphrag as Record<string, unknown> | undefined;
  if (graphrag) {
    base.enableGraphRag = Boolean(graphrag.use_graphrag);
    const method = graphrag.method;
    if (method === 'general' || method === 'ner' || method === 'light') {
      base.graphRagMethod = method;
    }
  }

  const raptor = pc.raptor as Record<string, unknown> | undefined;
  if (raptor) base.enableRaptor = Boolean(raptor.use_raptor);

  const ext = pc.ext as Record<string, unknown> | undefined;
  if (ext) {
    if (ext.use_pageindex !== undefined) base.enablePageIndex = Boolean(ext.use_pageindex);
    if (ext.use_wiki !== undefined) base.enableWiki = Boolean(ext.use_wiki);
  }

  return base;
}

/** 构建 RAGFlow PATCH / 上传 FormData 用的 parser_config */
export function buildParserConfigPayload(config: DocumentUploadConfig): Record<string, unknown> {
  return {
    chunk_token_num: config.chunkTokenNum,
    delimiter: config.delimiter === '\\n' ? '\n' : config.delimiter,
    layout_recognize: config.layoutRecognize,
    graphrag: {
      use_graphrag: config.enableGraphRag,
      method: config.graphRagMethod,
      entity_types: ['organization', 'person', 'geo', 'event', 'category'],
      community: false,
      resolution: false,
    },
    raptor: {
      use_raptor: config.enableRaptor,
    },
    ext: {
      use_pageindex: config.enablePageIndex,
      use_wiki: config.enableWiki,
      rag3_pipelines: [
        'vector',
        'fulltext',
        ...(config.enablePageIndex ? ['pageindex'] : []),
        ...(config.enableGraphRag ? ['graph'] : []),
        ...(config.enableWiki ? ['wiki'] : []),
      ],
    },
  };
}

export function buildDocumentUploadRequest(config: DocumentUploadConfig) {
  return {
    chunk_method: config.chunkMethod,
    parser_config: buildParserConfigPayload(config),
  };
}

import type {
  KnowledgeBase,
  DocItem,
  ChunkItem,
  Conversation,
  ChatMessage,
} from './types'

export const knowledgeBases: KnowledgeBase[] = [
  {
    id: 'kb-legal',
    name: '法务合同知识库',
    icon: '📚',
    description: '合同模板、审查报告、违约条款等法务文档集合',
    docCount: 156,
    chunkCount: 12840,
    size: '500 MB',
    status: 'active',
    quality: 92.5,
    updatedAt: '2 小时前',
    embeddingModel: 'BGE-M3',
    llmModel: 'DeepSeek-v4',
  },
  {
    id: 'kb-finance',
    name: '财务报告知识库',
    icon: '📊',
    description: '季度财报、预算分析、成本核算数据',
    docCount: 89,
    chunkCount: 6230,
    size: '320 MB',
    status: 'indexing',
    quality: 88.1,
    updatedAt: '5 分钟前',
    embeddingModel: 'BGE-M3',
    llmModel: 'Qwen3-72B',
  },
  {
    id: 'kb-rd',
    name: '研发文档知识库',
    icon: '🔬',
    description: '技术方案、API 文档、架构设计资料',
    docCount: 234,
    chunkCount: 18500,
    size: '780 MB',
    status: 'active',
    quality: 90.3,
    updatedAt: '1 天前',
    embeddingModel: 'BCE-Embedding',
    llmModel: 'DeepSeek-v4',
  },
  {
    id: 'kb-compliance',
    name: '合规政策知识库',
    icon: '📋',
    description: '内控制度、合规政策、监管要求',
    docCount: 45,
    chunkCount: 3200,
    size: '140 MB',
    status: 'active',
    quality: 94.0,
    updatedAt: '3 天前',
    embeddingModel: 'BGE-M3',
    llmModel: 'Claude-3.5',
  },
  {
    id: 'kb-training',
    name: '培训材料知识库',
    icon: '📖',
    description: '员工培训课件、操作手册、最佳实践',
    docCount: 67,
    chunkCount: 4900,
    size: '210 MB',
    status: 'active',
    quality: 86.7,
    updatedAt: '6 小时前',
    embeddingModel: 'BGE-M3',
    llmModel: 'Qwen3-72B',
  },
  {
    id: 'kb-product',
    name: '产品手册知识库',
    icon: '🏗️',
    description: '产品规格、用户手册、FAQ 文档',
    docCount: 112,
    chunkCount: 8100,
    size: '410 MB',
    status: 'error',
    quality: 79.2,
    updatedAt: '12 小时前',
    embeddingModel: 'BCE-Embedding',
    llmModel: 'DeepSeek-v4',
  },
]

export const documents: DocItem[] = [
  {
    id: 'doc-1',
    name: '供应商合同模板V5.pdf',
    type: 'PDF',
    size: '2.3 MB',
    status: 'parsed',
    quality: 96,
    confidentiality: 'internal',
    updatedAt: '2 小时前',
  },
  {
    id: 'doc-2',
    name: '2024合规审查报告.pdf',
    type: 'PDF',
    size: '5.0 MB',
    status: 'parsed',
    quality: 94,
    confidentiality: 'confidential',
    updatedAt: '1 天前',
  },
  {
    id: 'doc-3',
    name: '采购协议条款.docx',
    type: 'DOCX',
    size: '1.0 MB',
    status: 'parsing',
    quality: null,
    confidentiality: 'internal',
    updatedAt: '进行中',
    progress: 62,
  },
  {
    id: 'doc-4',
    name: '财务数据Q2.xlsx',
    type: 'XLSX',
    size: '0.8 MB',
    status: 'failed',
    quality: null,
    confidentiality: 'restricted',
    updatedAt: '3 小时前',
  },
  {
    id: 'doc-5',
    name: '知识产权归属协议.pdf',
    type: 'PDF',
    size: '1.6 MB',
    status: 'parsed',
    quality: 91,
    confidentiality: 'confidential',
    updatedAt: '2 天前',
  },
  {
    id: 'doc-6',
    name: '竞业限制条款说明.docx',
    type: 'DOCX',
    size: '0.6 MB',
    status: 'parsed',
    quality: 89,
    confidentiality: 'internal',
    updatedAt: '4 天前',
  },
  {
    id: 'doc-7',
    name: '保密协议范本V2.md',
    type: 'MD',
    size: '0.2 MB',
    status: 'parsed',
    quality: 97,
    confidentiality: 'public',
    updatedAt: '5 天前',
  },
]

export const uploadQueue = [
  { id: 'u1', name: '合同模板V6.pdf', size: '2.3 MB', progress: 100, status: 'done' as const },
  { id: 'u2', name: '审计报告.pdf', size: '5.0 MB', progress: 48, status: 'parsing' as const },
  { id: 'u3', name: '数据表.xlsx', size: '1.2 MB', progress: 22, status: 'uploading' as const },
]

export const chunks: ChunkItem[] = [
  {
    id: 'c0',
    index: 0,
    title: '第一条 定义',
    content:
      '第一条 定义 1.1 "供应商"系指根据本合同约定向采购方提供货物及相关服务的法人或其他组织。1.2 "采购方"系指本合同中接受货物及服务的一方。',
    type: 'text',
    tokens: 512,
    page: '1',
    confidentiality: 'internal',
    strategy: '模板分块',
  },
  {
    id: 'c1',
    index: 1,
    title: '第二条 权利义务',
    content:
      '第二条 权利义务 2.1 采购方有权对供应商提供的货物进行验收，验收标准按照附件一执行。2.2 供应商应保证所提供货物符合国家相关标准及合同约定的质量要求。',
    type: 'text',
    tokens: 508,
    page: '1-2',
    confidentiality: 'internal',
    strategy: '模板分块',
  },
  {
    id: 'c2',
    index: 4,
    title: '违约金计算表',
    content: '',
    type: 'table',
    tokens: 256,
    page: '3',
    confidentiality: 'internal',
    strategy: '表格分块',
    tableData: {
      headers: ['违约类型', '计算标准', '上限'],
      rows: [
        ['延迟交货', '日 0.5%', '20%'],
        ['质量不合规', '货款 10%', '30%'],
        ['擅自转包', '合同总额 15%', '50%'],
      ],
    },
  },
  {
    id: 'c3',
    index: 5,
    title: '第八条 保密义务',
    content:
      '第八条 保密义务 8.1 双方应对在合作过程中知悉的对方商业秘密予以保密。8.2 保密期限为本合同终止后五年。8.3 违反保密义务的，应承担相应赔偿责任。',
    type: 'text',
    tokens: 487,
    page: '5',
    confidentiality: 'confidential',
    strategy: '模板分块',
  },
]

export const evalMetrics = [
  { key: 'recall', label: '检索召回率', value: 0.91, delta: 2.3, unit: '' },
  { key: 'precision', label: '检索精确率', value: 0.87, delta: 1.1, unit: '' },
  { key: 'faithfulness', label: '答案忠实度', value: 0.94, delta: -0.6, unit: '' },
  { key: 'relevancy', label: '答案相关性', value: 0.89, delta: 3.4, unit: '' },
]

export const evalRuns = [
  {
    id: 'run-1',
    name: '法务知识库回归测试',
    kb: '法务合同知识库',
    dataset: '法务QA-200',
    status: 'completed' as const,
    score: 0.92,
    cases: 200,
    date: '2024-06-05 14:32',
  },
  {
    id: 'run-2',
    name: '财报检索基线评测',
    kb: '财务报告知识库',
    dataset: '财务QA-150',
    status: 'running' as const,
    score: null,
    cases: 150,
    date: '2024-06-06 09:10',
    progress: 64,
  },
  {
    id: 'run-3',
    name: '研发文档语义评测',
    kb: '研发文档知识库',
    dataset: 'RD-QA-300',
    status: 'completed' as const,
    score: 0.88,
    cases: 300,
    date: '2024-06-04 18:45',
  },
  {
    id: 'run-4',
    name: '合规政策准确性测试',
    kb: '合规政策知识库',
    dataset: '合规QA-100',
    status: 'failed' as const,
    score: null,
    cases: 100,
    date: '2024-06-03 11:20',
  },
]

export const ragasRadar = [
  { dim: '上下文召回', value: 91 },
  { dim: '上下文精度', value: 87 },
  { dim: '忠实度', value: 94 },
  { dim: '答案相关', value: 89 },
  { dim: '答案正确', value: 85 },
  { dim: '语义相似', value: 90 },
]

export const sysUsers = [
  { id: 'u-1', name: '张伟', email: 'zhangwei@corp.com', dept: '法务部', role: '管理员', status: 'active' as const, lastLogin: '2 小时前' },
  { id: 'u-2', name: '李娜', email: 'lina@corp.com', dept: '财务部', role: '编辑者', status: 'active' as const, lastLogin: '今天 09:12' },
  { id: 'u-3', name: '王强', email: 'wangqiang@corp.com', dept: '研发部', role: '编辑者', status: 'active' as const, lastLogin: '昨天 18:30' },
  { id: 'u-4', name: '刘洋', email: 'liuyang@corp.com', dept: '合规部', role: '只读', status: 'disabled' as const, lastLogin: '5 天前' },
  { id: 'u-5', name: '陈静', email: 'chenjing@corp.com', dept: '人力资源', role: '只读', status: 'active' as const, lastLogin: '3 小时前' },
]

export const sysRoles = [
  { id: 'r-1', name: '系统管理员', desc: '拥有全部权限，可管理用户与系统配置', users: 3, perms: 24 },
  { id: 'r-2', name: '知识库管理员', desc: '管理指定知识库的文档与索引', users: 8, perms: 16 },
  { id: 'r-3', name: '编辑者', desc: '可上传文档、编辑分块、发起对话', users: 25, perms: 10 },
  { id: 'r-4', name: '只读用户', desc: '仅可检索与查看，无编辑权限', users: 142, perms: 4 },
]

export const permGroups = [
  {
    group: '知识库',
    items: [
      { key: 'kb.view', label: '查看知识库', enabled: true },
      { key: 'kb.create', label: '创建知识库', enabled: true },
      { key: 'kb.delete', label: '删除知识库', enabled: false },
    ],
  },
  {
    group: '文档',
    items: [
      { key: 'doc.upload', label: '上传文档', enabled: true },
      { key: 'doc.edit', label: '编辑分块', enabled: true },
      { key: 'doc.delete', label: '删除文档', enabled: false },
    ],
  },
  {
    group: '系统',
    items: [
      { key: 'sys.user', label: '用户管理', enabled: false },
      { key: 'sys.audit', label: '查看审计日志', enabled: false },
    ],
  },
]

export const pipelineStages = [
  { id: 'p1', name: '文档解析', desc: 'MinerU / Unstructured 多格式解析', status: 'completed' as const },
  { id: 'p2', name: '智能分块', desc: '语义 / 模板 / 表格分块策略', status: 'completed' as const },
  { id: 'p3', name: '向量嵌入', desc: 'BGE-M3 稠密向量生成', status: 'running' as const, progress: 72 },
  { id: 'p4', name: '五路索引', desc: '向量/全文/图谱/页面/摘要索引构建', status: 'running' as const, progress: 45 },
  { id: 'p5', name: '质量校验', desc: '分块质量与覆盖率校验', status: 'paused' as const },
]

export const indexChannels = [
  { name: '向量索引', desc: 'Milvus HNSW', progress: 100, status: 'completed' as const },
  { name: '全文索引', desc: 'Elasticsearch BM25', progress: 100, status: 'completed' as const },
  { name: '知识图谱', desc: 'Neo4j 实体关系', progress: 68, status: 'running' as const },
  { name: '页面索引', desc: '页级布局索引', progress: 100, status: 'completed' as const },
  { name: '摘要索引', desc: 'LLM 文档摘要', progress: 34, status: 'running' as const },
]

export const auditLogs = [
  { id: 'a-1', time: '2024-06-06 14:32:10', user: '张伟', action: '上传文档', target: '供应商合同模板V6.pdf', ip: '10.2.31.5', result: 'success' as const },
  { id: 'a-2', time: '2024-06-06 14:18:42', user: '李娜', action: '删除知识库', target: '测试知识库', ip: '10.2.31.8', result: 'success' as const },
  { id: 'a-3', time: '2024-06-06 13:55:01', user: '王强', action: '修改权限', target: '角色: 编辑者', ip: '10.2.31.12', result: 'success' as const },
  { id: 'a-4', time: '2024-06-06 13:40:20', user: '刘洋', action: '登录', target: '系统登录', ip: '203.0.113.7', result: 'failed' as const },
  { id: 'a-5', time: '2024-06-06 13:22:15', user: '陈静', action: '导出数据', target: '财务QA-150', ip: '10.2.31.20', result: 'success' as const },
  { id: 'a-6', time: '2024-06-06 12:58:33', user: '张伟', action: '重新索引', target: '法务合同知识库', ip: '10.2.31.5', result: 'success' as const },
]

export const monitorMetrics = [
  { key: 'qps', label: 'QPS', value: '124', sub: '查询/秒', color: 'text-chart-1' },
  { key: 'latency', label: 'P95 延迟', value: '1.8s', sub: '检索+生成', color: 'text-chart-2' },
  { key: 'gpu', label: 'GPU 利用率', value: '67%', sub: '8×A100', color: 'text-chart-3' },
  { key: 'uptime', label: '服务可用性', value: '99.97%', sub: '近 30 天', color: 'text-success' },
]

export const services = [
  { name: 'API 网关', status: 'healthy' as const, latency: '12ms' },
  { name: 'Milvus 向量库', status: 'healthy' as const, latency: '8ms' },
  { name: 'Elasticsearch', status: 'healthy' as const, latency: '15ms' },
  { name: 'Neo4j 图数据库', status: 'degraded' as const, latency: '142ms' },
  { name: 'LLM 推理服务', status: 'healthy' as const, latency: '1.2s' },
  { name: 'Embedding 服务', status: 'healthy' as const, latency: '45ms' },
]

export const conversations: Conversation[] = [
  { id: 'conv-1', title: '合同违约条款查询', group: '今天', pinned: true },
  { id: 'conv-2', title: '保密协议范围确认', group: '今天', pinned: true },
  { id: 'conv-3', title: '2024年度合规审查', group: '昨天' },
  { id: 'conv-4', title: '数据保护条款', group: '昨天' },
  { id: 'conv-5', title: '知识产权归属', group: '更早' },
  { id: 'conv-6', title: '竞业限制条款', group: '更早' },
]

export const sampleMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: '供应商延迟交货的违约金如何计算？',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      '根据公司标准采购合同模板（V5）第五条违约责任的约定：\n\n供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五[1]向采购方支付违约金。\n\n迟延超过 30 日的，采购方有权解除合同[2]，并要求供应商承担因此造成的全部损失。违约金总额上限为合同金额的 20%。',
    citations: [
      {
        index: 1,
        docName: '供应商合同模板V5.pdf',
        page: 'P3',
        snippet:
          '5.1 供应商迟延交货的，每迟延一日按迟延交付货物价值的千分之五向采购方支付违约金……',
        relevance: 95.6,
      },
      {
        index: 2,
        docName: '供应商合同模板V5.pdf',
        page: 'P3',
        snippet: '5.3 迟延交货超过三十日的，采购方有权单方解除合同……',
        relevance: 91.2,
      },
    ],
    confidence: { score: 0.92, level: 'high' },
    routing: { tier: 'Tier2', channel: '页面索引' },
    latency: '2.1s',
    feedback: null,
  },
]

import type {
  KnowledgeBase, Document, Chunk, Conversation, ChatMessage, Citation,
  EvalRun, ABTest, User, AuditLog, IndexStatusInfo, MonitorMetric
} from './types';

export const mockKBs: KnowledgeBase[] = [
  { kb_id: 'kb-001', name: '法务合同知识库', description: '包含公司所有合同模板、审查报告及法律法规', icon: '⚖️', embedding_model: 'BAAI/bge-m3', chunk_strategy: '通用分块', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'active', doc_count: 156, chunk_count: 12840, total_size_bytes: 524288000, created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-05T10:30:00Z' },
  { kb_id: 'kb-002', name: '财务报告知识库', description: '季度财报、年报及财务分析报告', icon: '📊', embedding_model: 'BAAI/bge-m3', chunk_strategy: '表格优先', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'indexing', doc_count: 89, chunk_count: 6230, total_size_bytes: 209715200, created_at: '2026-02-01T08:00:00Z', updated_at: '2026-06-05T10:05:00Z' },
  { kb_id: 'kb-003', name: '研发技术文档库', description: '技术规范、API文档、架构设计文档', icon: '🔬', embedding_model: 'BAAI/bge-m3', chunk_strategy: '代码感知', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'active', doc_count: 234, chunk_count: 18500, total_size_bytes: 786432000, created_at: '2026-01-20T08:00:00Z', updated_at: '2026-06-04T16:00:00Z' },
  { kb_id: 'kb-004', name: '合规政策知识库', description: '企业合规政策、内控规范与监管要求', icon: '📋', embedding_model: 'BAAI/bge-m3', chunk_strategy: '通用分块', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'active', doc_count: 45, chunk_count: 3200, total_size_bytes: 104857600, created_at: '2026-03-10T08:00:00Z', updated_at: '2026-06-02T09:00:00Z' },
  { kb_id: 'kb-005', name: '培训材料知识库', description: '员工培训手册、课件及考核材料', icon: '📖', embedding_model: 'BAAI/bge-m3', chunk_strategy: '通用分块', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'active', doc_count: 78, chunk_count: 5400, total_size_bytes: 157286400, created_at: '2026-02-15T08:00:00Z', updated_at: '2026-06-01T14:00:00Z' },
  { kb_id: 'kb-006', name: '产品手册知识库', description: '产品说明书、用户手册及FAQ文档', icon: '🏗️', embedding_model: 'BAAI/bge-m3', chunk_strategy: '通用分块', reranker_model: 'bge-reranker-v2-m3', llm_model: 'deepseek-v4', language: '中文', status: 'active', doc_count: 112, chunk_count: 8900, total_size_bytes: 262144000, created_at: '2026-01-25T08:00:00Z', updated_at: '2026-05-30T11:00:00Z' },
];

export const mockDocuments: Document[] = [
  { doc_id: 'doc-001', kb_id: 'kb-001', original_name: '供应商合同模板V5.pdf', file_type: 'PDF', file_size: 2411724, parse_status: 'parsed', parse_quality_score: 96, chunk_count: 85, page_count: 12, tags: ['合同', '供应商'], uploaded_by: '张伟', uploaded_at: '2026-06-05T08:00:00Z' },
  { doc_id: 'doc-002', kb_id: 'kb-001', original_name: '2024合规审查报告.pdf', file_type: 'PDF', file_size: 5242880, parse_status: 'parsed', parse_quality_score: 94, chunk_count: 132, page_count: 28, tags: ['合规', '审查'], uploaded_by: '张伟', uploaded_at: '2026-06-04T14:00:00Z' },
  { doc_id: 'doc-003', kb_id: 'kb-001', original_name: '采购协议条款.docx', file_type: 'DOCX', file_size: 1048576, parse_status: 'parsing', parse_quality_score: 0, chunk_count: 0, page_count: 0, tags: ['采购', '协议'], uploaded_by: '王芳', uploaded_at: '2026-06-05T10:20:00Z' },
  { doc_id: 'doc-004', kb_id: 'kb-001', original_name: '财务数据Q2.xlsx', file_type: 'XLSX', file_size: 838860, parse_status: 'failed', parse_quality_score: 0, chunk_count: 0, page_count: 0, tags: ['财务'], uploaded_by: '王芳', uploaded_at: '2026-06-04T16:00:00Z' },
  { doc_id: 'doc-005', kb_id: 'kb-001', original_name: '知识产权协议范本.pdf', file_type: 'PDF', file_size: 1887436, parse_status: 'parsed', parse_quality_score: 91, chunk_count: 62, page_count: 8, tags: ['知识产权'], uploaded_by: '李婷', uploaded_at: '2026-06-03T10:00:00Z' },
  { doc_id: 'doc-006', kb_id: 'kb-001', original_name: '竞业限制协议模板.docx', file_type: 'DOCX', file_size: 524288, parse_status: 'parsed', parse_quality_score: 88, chunk_count: 34, page_count: 5, tags: ['人事', '竞业'], uploaded_by: '李婷', uploaded_at: '2026-06-02T15:00:00Z' },
];

export const mockChunks: Chunk[] = [
  { chunk_id: 'c-001', chunk_index: 0, content_preview: '第一条 定义 1.1 "供应商"系指根据本合同约定向采购方提供货物或服务的企业法人或其他经济组织。1.2 "采购方"系指依据本合同约定向供应商支付货款并取得货物所有权的一方。', content_type: 'text', chunk_strategy: '模板分块', token_count: 512, page_number: 1, section_title: '第一条 定义', acl_level: 'internal' },
  { chunk_id: 'c-002', chunk_index: 1, content_preview: '第二条 权利义务 2.1 采购方有权对供应商提供的货物进行验收检查，不符合约定质量标准的，采购方有权拒绝收货或要求供应商更换。2.2 供应商应保证其提供的货物符合国家相关标准及合同约定规格。', content_type: 'text', chunk_strategy: '模板分块', token_count: 508, page_number: 1, section_title: '第二条 权利义务', acl_level: 'internal' },
  { chunk_id: 'c-003', chunk_index: 2, content_preview: '第三条 价格与付款 3.1 本合同项下货物总价款为人民币（大写）[__________]元整（¥[______]）。3.2 采购方应在验收合格后30个工作日内完成付款。', content_type: 'text', chunk_strategy: '模板分块', token_count: 298, page_number: 2, section_title: '第三条 价格与付款', acl_level: 'confidential' },
  { chunk_id: 'c-004', chunk_index: 3, content_preview: '第五条 违约责任', content_type: 'table', chunk_strategy: '表格分块', token_count: 256, page_number: 3, section_title: '第五条 违约责任', acl_level: 'internal' },
  { chunk_id: 'c-005', chunk_index: 4, content_preview: '第八条 保密义务 8.1 双方均应对因履行本合同而知悉的对方商业秘密、技术秘密及其他需要保密的信息（以下简称"保密信息"）予以严格保密。8.2 保密期限为合同履行期间及合同终止或解除后5年。', content_type: 'text', chunk_strategy: '模板分块', token_count: 486, page_number: 8, section_title: '第八条 保密义务', acl_level: 'internal' },
];

export const mockConversations: Conversation[] = [
  { conv_id: 'conv-001', title: '合同违约条款查询', kb_ids: ['kb-001'], message_count: 6, created_at: '2026-06-05T09:00:00Z', last_message: '供应商延迟交货的违约金如何计算？' },
  { conv_id: 'conv-002', title: '保密协议范围确认', kb_ids: ['kb-001'], message_count: 4, created_at: '2026-06-05T08:30:00Z', last_message: '保密协议中的保密期限是多久？' },
  { conv_id: 'conv-003', title: '2024年度合规审查', kb_ids: ['kb-001', 'kb-004'], message_count: 12, created_at: '2026-06-04T15:00:00Z', last_message: '本年度合规风险主要集中在哪些方面？' },
  { conv_id: 'conv-004', title: '数据保护条款', kb_ids: ['kb-004'], message_count: 8, created_at: '2026-06-04T10:00:00Z', last_message: '数据处理协议需要包含哪些必要条款？' },
  { conv_id: 'conv-005', title: '知识产权归属问题', kb_ids: ['kb-001'], message_count: 5, created_at: '2026-06-03T14:00:00Z', last_message: '外包开发成果的知识产权如何归属？' },
];

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-001', role: 'user', content: '供应商延迟交货的违约金如何计算？', created_at: '2026-06-05T09:00:00Z',
  },
  {
    id: 'msg-002', role: 'assistant',
    content: `根据公司**标准采购合同模板（V5）第五条**的违约责任条款，供应商迟延交货的违约金计算规则如下：

**1. 基本违约金**
供应商迟延交货的，每迟延一日应按迟延交付货物**价值的千分之五（0.5%）**[1]向采购方支付违约金。

**2. 解除合同**
迟延超过**30日**的，采购方有权解除合同[2]，并要求供应商赔偿因此造成的全部损失。

**3. 违约金上限**
累计违约金不超过合同标的总金额的**20%**[1]，超过部分可通过诉讼途径主张实际损失赔偿。

**4. 不可抗力例外**
因不可抗力导致的延迟不适用上述违约金条款，但供应商需在48小时内书面通知采购方[3]。`,
    citations: [
      { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.1', snippet: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金，累计违约金不超过合同总额20%。', relevance_score: 0.956 },
      { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.2', snippet: '迟延超过三十日的，采购方有权解除合同并要求赔偿全部实际损失。', relevance_score: 0.932 },
      { index: 3, doc_name: '供应商合同模板V5.pdf', page_number: 5, section: '第七条 不可抗力', snippet: '因不可抗力导致无法履约的，受影响方应在48小时内以书面形式通知对方。', relevance_score: 0.878 },
    ],
    confidence: 0.92, confidence_level: 'high', routing_tier: 'Tier 2', channels: ['PageIndex', '向量检索'],
    created_at: '2026-06-05T09:00:08Z', latency_ms: 2100,
  },
];

export const mockEvalRuns: EvalRun[] = [
  { run_id: 'eval-001', name: '6月Faithfulness回归评测', kb_id: 'kb-001', status: 'completed', scores: { faithfulness: 0.92, context_precision: 0.88, answer_relevancy: 0.91, hallucination_rate: 0.04 }, baseline_scores: { faithfulness: 0.89, context_precision: 0.87, answer_relevancy: 0.93, hallucination_rate: 0.05 }, test_set_size: 500, started_at: '2026-06-05T06:00:00Z', completed_at: '2026-06-05T06:12:00Z', duration_min: 12 },
  { run_id: 'eval-002', name: '5月综合质量评测', kb_id: 'kb-001', status: 'completed', scores: { faithfulness: 0.89, context_precision: 0.87, answer_relevancy: 0.93, hallucination_rate: 0.05 }, baseline_scores: { faithfulness: 0.86, context_precision: 0.85, answer_relevancy: 0.90, hallucination_rate: 0.07 }, test_set_size: 500, started_at: '2026-05-31T06:00:00Z', completed_at: '2026-05-31T06:15:00Z', duration_min: 15 },
  { run_id: 'eval-003', name: '财务知识库评测', kb_id: 'kb-002', status: 'running', scores: {}, baseline_scores: {}, test_set_size: 300, started_at: '2026-06-05T10:00:00Z', completed_at: null },
];

export const mockABTests: ABTest[] = [
  { test_id: 'ab-001', name: 'BGE-M3 vs BCE-Embedding 嵌入模型对比', status: 'running', variant_a_name: 'BGE-M3', variant_b_name: 'BCE-Embedding', traffic_ratio: [50, 50], metrics_a: { faithfulness: 0.92, recall_10: 0.85, p95_latency: 1.8 }, metrics_b: { faithfulness: 0.89, recall_10: 0.83, p95_latency: 1.5 }, samples_a: 1250, samples_b: 1248, p_value: 0.032, started_at: '2026-06-02T00:00:00Z', winner: null },
  { test_id: 'ab-002', name: 'DeepDoc vs MinerU 解析引擎对比', status: 'completed', variant_a_name: 'DeepDoc', variant_b_name: 'MinerU', traffic_ratio: [50, 50], metrics_a: { faithfulness: 0.93, recall_10: 0.87, p95_latency: 2.1 }, metrics_b: { faithfulness: 0.89, recall_10: 0.84, p95_latency: 1.9 }, samples_a: 2100, samples_b: 2098, p_value: 0.008, started_at: '2026-06-01T00:00:00Z', winner: 'a' },
];

export const mockUsers: User[] = [
  { user_id: 'u-001', display_name: '张伟', email: 'zhang.wei@corp.com', department: '法务部', role: '知识库管理员', status: 'active', last_login: '2026-06-05T10:00:00Z' },
  { user_id: 'u-002', display_name: '李婷', email: 'li.ting@corp.com', department: 'AI平台事业部', role: '平台管理员', status: 'active', last_login: '2026-06-05T09:45:00Z' },
  { user_id: 'u-003', display_name: '陈工', email: 'chen.gong@corp.com', department: '算法组', role: '开发者', status: 'active', last_login: '2026-06-05T08:30:00Z' },
  { user_id: 'u-004', display_name: '王芳', email: 'wang.fang@corp.com', department: '知识管理部', role: '知识库管理员', status: 'active', last_login: '2026-06-04T17:00:00Z' },
  { user_id: 'u-005', display_name: '赵明', email: 'zhao.ming@corp.com', department: '财务部', role: '普通用户', status: 'active', last_login: '2026-06-04T15:30:00Z' },
  { user_id: 'u-006', display_name: '刘洋', email: 'liu.yang@corp.com', department: '合规部', role: '审计员', status: 'disabled', last_login: '2026-05-20T10:00:00Z' },
];

export const mockAuditLogs: AuditLog[] = [
  { log_id: 'log-001', timestamp: '2026-06-06 10:30:15', user_name: '张伟', action: '知识库查询', resource: 'kb_法务合同', ip: '10.0.1.5', result: 'success' },
  { log_id: 'log-002', timestamp: '2026-06-06 10:28:42', user_name: '王芳', action: '上传文档', resource: 'doc_采购协议条款', ip: '10.0.2.3', result: 'success' },
  { log_id: 'log-003', timestamp: '2026-06-06 10:15:08', user_name: '李婷', action: '修改流水线配置', resource: 'pipeline_向量检索', ip: '10.0.1.8', result: 'success' },
  { log_id: 'log-004', timestamp: '2026-06-06 09:55:33', user_name: '陈工', action: 'API调用', resource: 'kb_研发文档', ip: '10.0.3.12', result: 'success' },
  { log_id: 'log-005', timestamp: '2026-06-06 09:30:19', user_name: '张伟', action: '删除文档', resource: 'doc_旧合同V3', ip: '10.0.1.5', result: 'success' },
  { log_id: 'log-006', timestamp: '2026-06-06 09:12:44', user_name: '刘洋', action: '权限越权访问', resource: 'kb_财务报告', ip: '10.0.4.9', result: 'failed' },
  { log_id: 'log-007', timestamp: '2026-06-06 08:50:21', user_name: '赵明', action: '导出审计日志', resource: 'audit_logs', ip: '10.0.2.8', result: 'failed' },
  { log_id: 'log-008', timestamp: '2026-06-06 08:30:05', user_name: '李婷', action: '创建用户', resource: 'user_孙立', ip: '10.0.1.8', result: 'success' },
];

export const mockIndexStatuses: IndexStatusInfo[] = [
  { pipeline: 'vector', label: '向量索引', indexed: 154, total: 156, health: 98, status: 'completed', last_updated: '2分钟前', failed_count: 2 },
  { pipeline: 'fulltext', label: '全文索引', indexed: 156, total: 156, health: 100, status: 'completed', last_updated: '5分钟前', failed_count: 0 },
  { pipeline: 'pageindex', label: 'PageIndex', indexed: 85, total: 156, health: 85, status: 'running', last_updated: '1小时前', failed_count: 12 },
  { pipeline: 'graph', label: '图谱索引', indexed: 42, total: 156, health: 72, status: 'running', last_updated: '3小时前', failed_count: 0 },
  { pipeline: 'wiki', label: 'Wiki编译', indexed: 12, total: 42, health: 60, status: 'paused', last_updated: '1天前', failed_count: 0 },
];

export const mockMonitorMetrics: MonitorMetric[] = [
  { label: 'QPS', value: '1,250/s', change: '+15%', trend: 'up', positive: true },
  { label: 'P95 延迟', value: '1.8s', change: '-0.2s', trend: 'down', positive: true },
  { label: '错误率', value: '0.3%', change: '稳定', trend: 'stable', positive: true },
  { label: 'GPU 利用率', value: '78%', change: '+5%', trend: 'up', positive: false },
];

export const evalTrends = [
  { month: '1月', faithfulness: 0.85, context_precision: 0.82, answer_relevancy: 0.87, hallucination: 0.08 },
  { month: '2月', faithfulness: 0.86, context_precision: 0.83, answer_relevancy: 0.88, hallucination: 0.07 },
  { month: '3月', faithfulness: 0.87, context_precision: 0.85, answer_relevancy: 0.89, hallucination: 0.07 },
  { month: '4月', faithfulness: 0.88, context_precision: 0.86, answer_relevancy: 0.91, hallucination: 0.06 },
  { month: '5月', faithfulness: 0.89, context_precision: 0.87, answer_relevancy: 0.93, hallucination: 0.05 },
  { month: '6月', faithfulness: 0.92, context_precision: 0.88, answer_relevancy: 0.91, hallucination: 0.04 },
];

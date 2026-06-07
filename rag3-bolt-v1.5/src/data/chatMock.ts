import type { ChatMessage } from '../types';

export const CONV_PINNED = new Set(['conv-001', 'conv-002', 'conv-003']);

export const CONV_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-001': [
    { id: 'm1', role: 'user', content: '供应商延迟交货的违约金如何计算？', created_at: '2026-06-05T09:00:00Z' },
    {
      id: 'm2', role: 'assistant',
      content: `根据公司**标准采购合同模板（V5）第五条**的违约责任条款，供应商迟延交货的违约金计算规则如下：

**1. 基本违约金**
供应商迟延交货的，每迟延一日应按迟延交付货物**价值的千分之五（0.5%）**[1]向采购方支付违约金。

**2. 解除合同权利**
迟延超过 **30 日**的，采购方有权解除合同[2]，并要求供应商赔偿因此造成的全部损失。

**3. 违约金上限**
累计违约金不超过合同标的总金额的 **20%**[1]。`,
      citations: [
        { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.1', snippet: '每迟延一日按货物价值千分之五支付违约金，累计不超过20%。', relevance_score: 0.956 },
        { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.2', snippet: '迟延超过三十日，采购方有权解除合同。', relevance_score: 0.932 },
      ],
      confidence: 0.92, confidence_level: 'high', routing_tier: 'Tier 2', channels: ['PageIndex', '向量检索'],
      created_at: '2026-06-05T09:00:08Z', latency_ms: 2100,
    },
    { id: 'm3', role: 'user', content: '那不可抗力的情况怎么处理？', created_at: '2026-06-05T09:02:00Z' },
    {
      id: 'm4', role: 'assistant',
      content: `**不可抗力条款**（第七条）规定：

因不可抗力导致无法履约的，受影响方应在 **48 小时内**书面通知对方[1]。在此情形下，迟延交货违约金条款**不适用**，但双方应协商合理延期或解除合同。

通知须包含：不可抗力事件性质、预计影响期限、已采取的减损措施。`,
      citations: [
        { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 5, section: '第七条 不可抗力', snippet: '应在48小时内书面通知对方，违约金条款不适用。', relevance_score: 0.891 },
      ],
      confidence: 0.88, confidence_level: 'high', routing_tier: 'Tier 1', channels: ['向量检索'],
      created_at: '2026-06-05T09:02:05Z', latency_ms: 980,
    },
  ],
  'conv-002': [
    { id: 'c2-1', role: 'user', content: '保密协议中的保密期限是多久？', created_at: '2026-06-05T08:30:00Z' },
    {
      id: 'c2-2', role: 'assistant',
      content: `根据**第八条 保密义务（§8.2）**：

- 合同**履行期间**全程保密
- 合同终止或解除后 **5 年**内保密义务延续[1]

例外：信息已成为公众知识、从第三方合法获取、或法律强制披露的情形不受约束[2]。`,
      citations: [
        { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 §8.2', snippet: '保密期限为履行期间及终止后5年。', relevance_score: 0.978 },
        { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 §8.3', snippet: '公众知识、合法第三方获取、法律强制披露为例外。', relevance_score: 0.941 },
      ],
      confidence: 0.95, confidence_level: 'high', routing_tier: 'Tier 1', channels: ['向量检索'],
      created_at: '2026-06-05T08:30:06Z', latency_ms: 850,
    },
  ],
};

export const QUERY_TRACE_STEPS = [
  { stage: 'L1 分类', ms: 120, detail: '复杂度 Tier 2 · 意图：精确答案' },
  { stage: 'L2 路由', ms: 45, detail: '主通道 PageIndex + 辅通道向量' },
  { stage: 'L3 检索', ms: 1400, detail: '召回 12 chunks → 融合 Top-5' },
  { stage: 'L4 精排', ms: 360, detail: 'CrossEncoder rerank' },
  { stage: 'L5 生成', ms: 1100, detail: 'DeepSeek-v4 · 512 tokens' },
];

export const PROMPT_TEMPLATES = [
  { id: 'legal', name: '法务助手', prompt: '你是企业法务助手，基于知识库准确引用条款作答，不确定时明确说明。' },
  { id: 'general', name: '通用问答', prompt: '你是知识库问答助手，回答简洁、有据可查。' },
  { id: 'analyst', name: '分析对比', prompt: '你是文档分析助手，擅长跨文档对比与归纳总结。' },
];

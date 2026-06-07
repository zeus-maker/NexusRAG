import { useState } from 'react';
import { Row, Col, Button, Input, Select, Space, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { KnowledgeBaseCard } from '@/components/KnowledgeBaseCard';
import type { KnowledgeBase } from '@/types/kb';

export default function ListPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 模拟数据
  const mockKnowledgeBases: KnowledgeBase[] = [
    {
      kb_id: 'kb-001',
      name: '法务合同知识库',
      description: '包含公司所有法务合同、法律文件和政策文档',
      language: 'zh-CN',
      chunk_strategy: 'general',
      embedding_model: 'BGE-M3',
      llm_model: 'DeepSeek-v4',
      reranker_model: 'BGE-Reranker-v2-m3',
      status: 'active',
      document_count: 156,
      chunk_count: 12840,
      storage_size: 524288000,
      created_at: '2026-05-01T00:00:00Z',
      updated_at: '2026-06-06T10:30:00Z',
    },
    {
      kb_id: 'kb-002',
      name: '财务报告知识库',
      description: '季度和年度财务报告、预算文档和财务分析',
      language: 'zh-CN',
      chunk_strategy: 'finance',
      embedding_model: 'BGE-M3',
      llm_model: 'DeepSeek-v4',
      status: 'indexing',
      document_count: 89,
      chunk_count: 6230,
      storage_size: 314572800,
      created_at: '2026-05-15T00:00:00Z',
      updated_at: '2026-06-06T09:45:00Z',
    },
    {
      kb_id: 'kb-003',
      name: '研发文档知识库',
      description: '技术文档、API文档、开发指南和架构设计',
      language: 'zh-CN',
      chunk_strategy: 'technical',
      embedding_model: 'BGE-M3',
      llm_model: 'DeepSeek-v4',
      status: 'active',
      document_count: 234,
      chunk_count: 18500,
      storage_size: 734003200,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-06-05T16:20:00Z',
    },
    {
      kb_id: 'kb-004',
      name: '合规政策知识库',
      description: '公司合规政策、行业法规和监管要求',
      language: 'zh-CN',
      chunk_strategy: 'general',
      embedding_model: 'BGE-M3',
      llm_model: 'DeepSeek-v4',
      status: 'active',
      document_count: 45,
      chunk_count: 3200,
      storage_size: 104857600,
      created_at: '2026-05-20T00:00:00Z',
      updated_at: '2026-06-03T14:15:00Z',
    },
  ];

  // 模拟API调用
  const { data: kbList, isLoading } = useQuery({
    queryKey: ['kb-list', searchText, statusFilter],
    queryFn: async () => {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = mockKnowledgeBases;
      
      if (searchText) {
        filtered = filtered.filter(kb => 
          kb.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (kb.description && kb.description.toLowerCase().includes(searchText.toLowerCase()))
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(kb => kb.status === statusFilter);
      }
      
      return filtered;
    },
  });

  const handleCreateKB = async (values: Record<string, unknown>) => {
    try {
      message.success('知识库创建成功');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('知识库创建失败');
    }
  };

  const handleViewDetail = (kbId: string) => {
    message.info(`查看知识库详情: ${kbId}`);
  };

  const handleEdit = (kb: KnowledgeBase) => {
    message.info(`编辑知识库: ${kb.name}`);
  };

  const handleDelete = (kbId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个知识库吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('知识库删除成功');
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>知识库管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          创建知识库
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Input.Search
              placeholder="搜索知识库..."
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '活跃', value: 'active' },
                { label: '索引中', value: 'indexing' },
                { label: '错误', value: 'error' },
              ]}
            />
          </Space>
          <Space>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            />
          </Space>
        </Space>
      </Card>

      {isLoading ? (
        <Card loading />
      ) : (
        <Row gutter={[16, 16]}>
          {kbList?.map((kb) => (
            <Col key={kb.kb_id} xs={24} sm={12} md={8} lg={6}>
              <KnowledgeBaseCard
                kb={kb}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="创建知识库"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateKB}>
          <Form.Item
            label="知识库名称"
            name="name"
            rules={[
              { required: true, message: '请输入知识库名称' },
              { min: 2, max: 50, message: '名称长度为2-50个字符' },
            ]}
          >
            <Input placeholder="输入知识库名称（2-50字符）" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 200, message: '描述最多200个字符' }]}
          >
            <Input.TextArea placeholder="输入描述（选填，最多200字符）" rows={3} />
          </Form.Item>

          <Form.Item
            label="默认语言"
            name="language"
            initialValue="zh-CN"
            rules={[{ required: true, message: '请选择默认语言' }]}
          >
            <Select>
              <Select.Option value="zh-CN">中文</Select.Option>
              <Select.Option value="en-US">英文</Select.Option>
              <Select.Option value="ja-JP">日文</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="默认分块策略"
            name="chunk_strategy"
            initialValue="general"
            rules={[{ required: true, message: '请选择分块策略' }]}
          >
            <Select>
              <Select.Option value="general">通用分块</Select.Option>
              <Select.Option value="finance">财务分块</Select.Option>
              <Select.Option value="technical">技术分块</Select.Option>
              <Select.Option value="legal">法务分块</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="嵌入模型"
            name="embedding_model"
            initialValue="BGE-M3"
            rules={[{ required: true, message: '请选择嵌入模型' }]}
          >
            <Select>
              <Select.Option value="BGE-M3">BGE-M3</Select.Option>
              <Select.Option value="BCE-Embedding">BCE-Embedding</Select.Option>
              <Select.Option value="text-embedding-3-small">OpenAI text-embedding-3-small</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="LLM模型"
            name="llm_model"
            initialValue="DeepSeek-v4"
            rules={[{ required: true, message: '请选择LLM模型' }]}
          >
            <Select>
              <Select.Option value="DeepSeek-v4">DeepSeek-v4</Select.Option>
              <Select.Option value="Qwen3-72B">Qwen3-72B</Select.Option>
              <Select.Option value="GPT-4o">GPT-4o</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Reranker模型"
            name="reranker_model"
            initialValue="BGE-Reranker-v2-m3"
          >
            <Select allowClear>
              <Select.Option value="BGE-Reranker-v2-m3">BGE-Reranker-v2-m3</Select.Option>
              <Select.Option value="BGE-Reranker-Large">BGE-Reranker-Large</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
import { useState } from 'react';
import { Table, Button, Input, Select, Space, Card, Tag, Dropdown, Modal, message } from 'antd';
import { UploadOutlined, LinkOutlined, SearchOutlined, FilterOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { DocumentUploader } from '@/components/DocumentUploader';
import type { Document } from '@/types/kb';

export function DocumentPage() {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 模拟文档数据
  const mockDocuments: Document[] = [
    {
      doc_id: 'doc-001',
      kb_id: 'kb-001',
      name: '供应商合同模板V5.pdf',
      file_type: 'PDF',
      file_size: 2411724,
      status: 'parsed',
      parse_quality: 96,
      chunk_count: 85,
      created_at: '2026-06-06T08:00:00Z',
      updated_at: '2026-06-06T08:30:00Z',
      tags: ['合同', '模板'],
    },
    {
      doc_id: 'doc-002',
      kb_id: 'kb-001',
      name: '2024合规审查报告.pdf',
      file_type: 'PDF',
      file_size: 5242880,
      status: 'parsed',
      parse_quality: 94,
      chunk_count: 120,
      created_at: '2026-06-05T10:00:00Z',
      updated_at: '2026-06-05T10:45:00Z',
      tags: ['合规', '报告'],
    },
    {
      doc_id: 'doc-003',
      kb_id: 'kb-001',
      name: '采购协议条款.docx',
      file_type: 'DOCX',
      file_size: 1048576,
      status: 'parsing',
      created_at: '2026-06-06T09:00:00Z',
      updated_at: '2026-06-06T09:00:00Z',
      tags: ['采购', '协议'],
    },
    {
      doc_id: 'doc-004',
      kb_id: 'kb-001',
      name: '财务数据Q2.xlsx',
      file_type: 'XLSX',
      file_size: 838860,
      status: 'failed',
      created_at: '2026-06-06T11:00:00Z',
      updated_at: '2026-06-06T11:05:00Z',
      tags: ['财务', '数据'],
    },
  ];

  // 模拟API调用
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', searchText, typeFilter, statusFilter],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = mockDocuments;
      
      if (searchText) {
        filtered = filtered.filter(doc => 
          doc.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(doc => doc.status === statusFilter);
      }
      
      return filtered;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'success';
      case 'parsing':
        return 'processing';
      case 'failed':
        return 'error';
      case 'uploading':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'parsed':
        return '已解析';
      case 'parsing':
        return '解析中';
      case 'failed':
        return '失败';
      case 'uploading':
        return '上传中';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Document) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: Document) => (
        <Space>
          <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
          {record.parse_quality !== undefined && (
            <Tag color="blue">{record.parse_quality}分</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Document) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: '查看详情' },
              { key: 'parse', label: '解析预览' },
              { key: 'chunks', label: '分块预览' },
              { key: 'reparse', label: '重新解析', disabled: record.status !== 'parsed' },
              { key: 'divider', type: 'divider' },
              { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(record.doc_id) },
            ],
          }}
        >
          <Button type="text">更多</Button>
        </Dropdown>
      ),
    },
  ];

  const handleDelete = (docId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('文档删除成功');
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>文档管理</h2>
        <Space>
          <Button icon={<LinkOutlined />}>URL导入</Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
            上传文档
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Input.Search
              placeholder="搜索文档..."
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
                { label: '已解析', value: 'parsed' },
                { label: '解析中', value: 'parsing' },
                { label: '失败', value: 'failed' },
              ]}
            />
          </Space>
          <Button icon={<ReloadOutlined />}>刷新</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={documents}
        loading={isLoading}
        rowKey="doc_id"
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title="上传文档"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={700}
      >
        <DocumentUploader
          kbId="kb-001"
          onUploadComplete={() => {
            setUploadModalVisible(false);
          }}
        />
      </Modal>
    </div>
  );
}
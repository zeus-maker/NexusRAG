import { Card, Tag, Progress, Space, Dropdown, Button } from 'antd';
import { MoreOutlined, DatabaseOutlined, FileTextOutlined, HddOutlined } from '@ant-design/icons';
import type { KnowledgeBase } from '@/types/kb';

interface KnowledgeBaseCardProps {
  kb: KnowledgeBase;
  onViewDetail: (kbId: string) => void;
  onEdit: (kb: KnowledgeBase) => void;
  onDelete: (kbId: string) => void;
}

export function KnowledgeBaseCard({ kb, onViewDetail, onEdit, onDelete }: KnowledgeBaseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'indexing':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'indexing':
        return '索引中';
      case 'error':
        return '错误';
      default:
        return status;
    }
  };

  const menuItems = [
    { key: 'view', label: '查看详情', onClick: () => onViewDetail(kb.kb_id) },
    { key: 'edit', label: '编辑', onClick: () => onEdit(kb) },
    { key: 'delete', label: '删除', danger: true, onClick: () => onDelete(kb.kb_id) },
  ];

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      actions={[
        <Button type="link" onClick={() => onViewDetail(kb.kb_id)}>
          查看详情
        </Button>,
      ]}
      extra={
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      }
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <DatabaseOutlined style={{ fontSize: 24, color: '#1677ff', marginRight: 12 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {kb.name}
            </div>
            {kb.description && (
              <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kb.description}
              </div>
            )}
          </div>
        </div>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="small">
              <FileTextOutlined style={{ color: '#999' }} />
              <span style={{ fontSize: 12, color: '#666' }}>{kb.document_count} 文档</span>
            </Space>
            <Space size="small">
              <HddOutlined style={{ color: '#999' }} />
              <span style={{ fontSize: 12, color: '#666' }}>{formatStorageSize(kb.storage_size)}</span>
            </Space>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#666' }}>{kb.chunk_count.toLocaleString()} 块</span>
            <Tag color={getStatusColor(kb.status)}>{getStatusText(kb.status)}</Tag>
          </div>

          <div style={{ fontSize: 12, color: '#999' }}>
            更新于 {new Date(kb.updated_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </Space>
      </div>
    </Card>
  );
}
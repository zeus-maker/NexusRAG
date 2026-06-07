import { Popover, Card, Tag, Button, Space } from 'antd';
import { EyeOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons';
import type { Citation } from '@/types/chat';

interface CitationCardProps {
  citation: Citation;
  compact?: boolean;
  onViewOriginal?: (citation: Citation) => void;
}

export function CitationCard({ citation, compact = false, onViewOriginal }: CitationCardProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  const getRelevanceText = (score: number) => {
    if (score >= 0.9) return '高';
    if (score >= 0.7) return '中';
    return '低';
  };

  const content = (
    <Card
      size="small"
      style={{ width: 400, maxHeight: 300, overflow: 'auto' }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ marginBottom: 8 }}>
        <Space size={4}>
          <Tag color="blue">{citation.doc_name}</Tag>
          <Tag>第{citation.page_number}页</Tag>
        </Space>
      </div>

      <div
        style={{
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: 12,
          fontSize: 12,
          lineHeight: '1.6',
          maxHeight: 120,
          overflow: 'auto',
        }}
      >
        "{citation.snippet}"
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size="small">
          <span style={{ fontSize: 12, color: '#999' }}>相关度:</span>
          <Tag color={getRelevanceColor(citation.relevance_score)}>
            {(citation.relevance_score * 100).toFixed(1)}% ({getRelevanceText(citation.relevance_score)})
          </Tag>
        </Space>

        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewOriginal?.(citation)}
          >
            查看原文
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(citation.snippet);
            }}
          >
            复制
          </Button>
        </Space>
      </div>
    </Card>
  );

  if (compact) {
    return (
      <Popover content={content} title={null} trigger="hover" placement="top">
        <Tag style={{ cursor: 'pointer', margin: '0 2px' }}>
          [{citation.index}]
        </Tag>
      </Popover>
    );
  }

  return <div>{content}</div>;
}
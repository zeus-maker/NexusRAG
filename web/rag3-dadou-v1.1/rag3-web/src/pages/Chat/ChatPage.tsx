import { useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, Space, Card, Tag, Drawer, List, Empty, Spin } from 'antd';
import { SendOutlined, StopOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { CitationCard } from '@/components/CitationCard';
import type { ChatMessage, Conversation } from '@/types/chat';

const { Sider, Content } = Layout;

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 模拟对话历史
  const mockConversations: Conversation[] = [
    {
      conv_id: 'conv-001',
      kb_ids: ['kb-001'],
      title: '合同违约条款查询',
      created_at: '2026-06-06T10:00:00Z',
      updated_at: '2026-06-06T10:30:00Z',
      message_count: 8,
    },
    {
      conv_id: 'conv-002',
      kb_ids: ['kb-002'],
      title: '财务数据分析',
      created_at: '2026-06-05T14:00:00Z',
      updated_at: '2026-06-05T14:45:00Z',
      message_count: 12,
    },
  ];

  // 模拟当前对话的消息
  const mockMessages: ChatMessage[] = [
    {
      msg_id: 'msg-001',
      conv_id: 'conv-001',
      role: 'user',
      content: '供应商延迟交货的违约金如何计算？',
      created_at: '2026-06-06T10:00:00Z',
    },
    {
      msg_id: 'msg-002',
      conv_id: 'conv-001',
      role: 'assistant',
      content: '根据公司标准采购合同模板（V5）第五条违约责任的规定：\n\n供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五[1]向采购方支付违约金。\n\n迟延超过30日的，采购方有权解除合同[2]。',
      citations: [
        {
          index: 1,
          doc_id: 'doc-001',
          doc_name: '供应商合同模板V5.pdf',
          chunk_id: 'chunk-045',
          section: '第五条 违约责任',
          page_number: 3,
          snippet: '5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。',
          relevance_score: 0.956,
        },
        {
          index: 2,
          doc_id: 'doc-001',
          doc_name: '供应商合同模板V5.pdf',
          chunk_id: 'chunk-046',
          section: '第五条 违约责任',
          page_number: 3,
          snippet: '5.2 迟延超过30日的，采购方有权解除合同。',
          relevance_score: 0.923,
        },
      ],
      confidence: {
        score: 0.92,
        level: 'high',
        factors: {
          retrieval_quality: 0.95,
          generation_consistency: 0.93,
          source_authority: 0.90,
          cross_encoder_score: 0.91,
        },
      },
      routing_info: {
        tier: 'tier_2',
        classified_tier: 'tier_2',
        document_type: 'PDF原生',
        user_intent: '精确答案',
        security_level: '内部',
        primary_channel: 'page_index',
        secondary_channels: ['vector'],
        model: 'DeepSeek-v4',
      },
      created_at: '2026-06-06T10:00:05Z',
    },
  ];

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockConversations;
    },
  });

  useEffect(() => {
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      msg_id: `msg-${Date.now()}`,
      conv_id: currentConvId || 'conv-new',
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // 模拟流式响应
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        msg_id: `msg-${Date.now() + 1}`,
        conv_id: currentConvId || 'conv-new',
        role: 'assistant',
        content: '这是一个模拟的回答。在实际应用中，这里会通过SSE流式接收AI的回复内容。',
        citations: [],
        confidence: {
          score: 0.85,
          level: 'medium',
          factors: {
            retrieval_quality: 0.88,
            generation_consistency: 0.85,
            source_authority: 0.82,
            cross_encoder_score: 0.86,
          },
        },
        routing_info: {
          tier: 'tier_2',
          classified_tier: 'tier_2',
          document_type: '未知',
          user_intent: '一般查询',
          security_level: '内部',
          primary_channel: 'vector',
          secondary_channels: [],
          model: 'DeepSeek-v4',
        },
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 2000);
  };

  const handleStop = () => {
    setIsStreaming(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConvId(null);
  };

  const handleSelectConversation = (convId: string) => {
    setCurrentConvId(convId);
    setHistoryDrawerVisible(false);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier_1':
        return 'green';
      case 'tier_2':
        return 'blue';
      case 'tier_3':
        return 'orange';
      case 'tier_4':
        return 'red';
      default:
        return 'default';
    }
  };

  const getTierText = (tier: string) => {
    switch (tier) {
      case 'tier_1':
        return 'Tier 1';
      case 'tier_2':
        return 'Tier 2';
      case 'tier_3':
        return 'Tier 3';
      case 'tier_4':
        return 'Tier 4';
      default:
        return tier;
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      <Sider width={260} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', padding: '16px' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewChat}
            block
          >
            新对话
          </Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索对话..."
            size="small"
            allowClear
          />
        </div>

        <div style={{ overflowY: 'auto', height: 'calc(100% - 100px)' }}>
          {conversationsLoading ? (
            <Spin />
          ) : conversations && conversations.length > 0 ? (
            <List
              size="small"
              dataSource={conversations}
              renderItem={(conv) => (
                <List.Item
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: currentConvId === conv.conv_id ? '#e6f7ff' : 'transparent',
                  }}
                  onClick={() => handleSelectConversation(conv.conv_id)}
                >
                  <List.Item.Meta
                    avatar={<MessageOutlined style={{ color: '#1677ff' }} />}
                    title={
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {conv.title}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {conv.message_count} 条消息
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无对话历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Sider>

      <Content style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px' }}>
          {messages.length === 0 ? (
            <Empty
              description="开始新的对话"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 100 }}
            />
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {messages.map((message) => (
                <div
                  key={message.msg_id}
                  style={{
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: message.role === 'user' ? '#1677ff' : '#f5f5f5',
                      color: message.role === 'user' ? '#fff' : '#000',
                    }}
                  >
                    {message.role === 'assistant' && (
                      <div style={{ marginBottom: 8 }}>
                        <Space size={4}>
                          <Tag color={getTierColor(message.routing_info?.tier || 'tier_2')}>
                            {getTierText(message.routing_info?.tier || 'tier_2')}
                          </Tag>
                          {message.routing_info?.document_type && (
                            <Tag>{message.routing_info.document_type}</Tag>
                          )}
                        </Space>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {message.content}
                    </div>

                    {message.citations && message.citations.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <Space wrap>
                          {message.citations.map((citation) => (
                            <CitationCard
                              key={citation.index}
                              citation={citation}
                              compact
                              onViewOriginal={(c) => {
                                console.log('View original:', c);
                              }}
                            />
                          ))}
                        </Space>
                      </div>
                    )}

                    {message.confidence && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <Space size="small">
                          <span style={{ fontSize: 12, color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#999' }}>
                            置信度:
                          </span>
                          <Tag color={getConfidenceColor(message.confidence.level)}>
                            {message.confidence.score.toFixed(2)} ({message.confidence.level === 'high' ? '高' : message.confidence.level === 'medium' ? '中' : '低'})
                          </Tag>
                          <span style={{ fontSize: 12, color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#999' }}>
                            {message.routing_info?.primary_channel}
                          </span>
                        </Space>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#f5f5f5',
                    }}
                  >
                    <Spin size="small" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <Card size="small" style={{ background: '#fff' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (e.shiftKey) return;
                e.preventDefault();
                handleSend();
              }}
              placeholder="输入您的问题... (Enter发送, Shift+Enter换行)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button
                type="primary"
                icon={<StopOutlined />}
                onClick={handleStop}
              >
                停止
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                发送
              </Button>
            )}
          </Space.Compact>
        </Card>
      </Content>
    </Layout>
  );
}
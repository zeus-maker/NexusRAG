import { useState } from 'react';
import { Layout, Card, Tree, Button, Space, Tag, Drawer, Empty, Spin } from 'antd';
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

export function ParsePreviewPage() {
  const [selectedKey, setSelectedKey] = useState<string[]>(['1']);
  const [loading, setLoading] = useState(false);

  // 模拟文档结构
  const treeData = [
    {
      title: '第一条 定义',
      key: '1',
      children: [
        { title: '1.1 供应商', key: '1-1' },
        { title: '1.2 采购方', key: '1-2' },
      ],
    },
    {
      title: '第二条 权利义务',
      key: '2',
      children: [
        { title: '2.1 采购方权利', key: '2-1' },
        { title: '2.2 供应商义务', key: '2-2' },
      ],
    },
    {
      title: '第五条 违约责任',
      key: '5',
      children: [
        { title: '5.1 延迟交货', key: '5-1' },
        { title: '5.2 质量问题', key: '5-2' },
      ],
    },
  ];

  // 模拟文档内容
  const documentContent = {
    '1': {
      title: '第一条 定义',
      content: `
        <div style={{ padding: '20px' }}>
          <h2>第一条 定义</h2>
          <p>1.1 "供应商"系指根据本合同约定向采购方提供货物、工程或服务的当事人。</p>
          <p>1.2 "采购方"系指根据本合同约定接受供应商提供的货物、工程或服务并支付价款的当事人。</p>
          <p>1.3 "合同"系指本合同及其附件、补充协议等构成合同整体的所有文件。</p>
        </div>
      `,
      page: 1,
    },
    '2': {
      title: '第二条 权利义务',
      content: `
        <div style={{ padding: '20px' }}>
          <h2>第二条 权利义务</h2>
          <p>2.1 采购方有权对供应商提供的货物、工程或服务进行检验和验收。</p>
          <p>2.2 供应商应按照合同约定的标准、期限和方式履行合同义务。</p>
        </div>
      `,
      page: 2,
    },
    '5': {
      title: '第五条 违约责任',
      content: `
        <div style={{ padding: '20px' }}>
          <h2>第五条 违约责任</h2>
          <p>5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。</p>
          <p>5.2 迟延超过30日的，采购方有权解除合同。</p>
          
          <table style={{ width: '100%', border: '1px solid #ddd', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>类型</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>计算标准</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>上限</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>延迟</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>日0.5%</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>20%</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>不合规</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>赔偿</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>合同金额</td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      page: 3,
    },
  };

  const handleSectionSelect = (selectedKeys: React.Key[]) => {
    setSelectedKey(selectedKeys as string[]);
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const currentContent = selectedKey.length > 0 ? documentContent[selectedKey[0] as keyof typeof documentContent] : null;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>解析预览 - 供应商合同模板V5.pdf</h2>
        <Space>
          <Button icon={<EyeOutlined />}>查看原文</Button>
          <Button icon={<DownloadOutlined />}>下载</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Tag color="success">质量评分: 96分</Tag>
          <Tag>页数: 5</Tag>
          <Tag>分块数: 85</Tag>
        </Space>
      </Card>

      <Layout style={{ background: '#fff', minHeight: 600 }}>
        <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Tree
            showIcon
            defaultExpandAll
            selectedKeys={selectedKey}
            onSelect={handleSectionSelect}
            treeData={treeData}
            style={{ padding: '16px' }}
          />
        </Sider>

        <Content style={{ padding: '24px', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
            </div>
          ) : currentContent ? (
            <div>
              <div
                style={{
                  padding: '24px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #f0f0f0',
                }}
              >
                <Space>
                  <FileTextOutlined style={{ fontSize: 16 }} />
                  <span style={{ fontWeight: 500 }}>{currentContent.title}</span>
                  <Tag color="blue">第{currentContent.page}页</Tag>
                </Space>
              </div>

              <div
                style={{
                  padding: '24px',
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  lineHeight: '1.8',
                }}
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            </div>
          ) : (
            <Empty description="请选择左侧目录查看内容" />
          )}
        </Content>

        <Sider width={300} style={{ background: '#fff', borderLeft: '1px solid #f0f0f0', padding: '16px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 12 }}>结构化数据</h4>
            <Card size="small" style={{ fontFamily: 'monospace', fontSize: 12 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`{
  "type": "section",
  "title": "第一条 定义",
  "page": 1,
  "bbox": [100, 200, 500, 300],
  "confidence": 0.96
}`}
              </pre>
            </Card>
          </div>

          <div>
            <h4 style={{ marginBottom: 12 }}>OCR标注</h4>
            <Card size="small">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无OCR标注"
              />
            </Card>
          </div>
        </Sider>
      </Layout>
    </div>
  );
}
import { useState } from 'react';
import { Row, Col, Card, Statistic, Select, Space, Progress, List, Tag, Button, Modal, Form, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import type { EvalDashboard } from '@/types/eval';

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 模拟评测仪表盘数据
  const mockDashboardData: EvalDashboard = {
    period: '30d',
    metrics: {
      faithfulness: { value: 0.92, change: 0.03, trend: 'up' },
      context_precision: { value: 0.88, change: 0.01, trend: 'up' },
      answer_relevancy: { value: 0.91, change: -0.02, trend: 'down' },
      hallucination_rate: { value: 0.04, change: -0.01, trend: 'down' },
    },
    trend_data: [
      { date: '2026-05-01', faithfulness: 0.88, context_precision: 0.85, answer_relevancy: 0.89, hallucination_rate: 0.06 },
      { date: '2026-05-08', faithfulness: 0.89, context_precision: 0.86, answer_relevancy: 0.90, hallucination_rate: 0.05 },
      { date: '2026-05-15', faithfulness: 0.90, context_precision: 0.87, answer_relevancy: 0.91, hallucination_rate: 0.05 },
      { date: '2026-05-22', faithfulness: 0.91, context_precision: 0.87, answer_relevancy: 0.90, hallucination_rate: 0.04 },
      { date: '2026-05-29', faithfulness: 0.92, context_precision: 0.88, answer_relevancy: 0.91, hallucination_rate: 0.04 },
    ],
    layered_eval: [
      { layer: '文档级', name: '解析质量', score: 0.92, description: '文档解析的准确性和完整性' },
      { layer: '块级', name: '分块合理性', score: 0.88, description: '文本分块的语义完整性和可读性' },
      { layer: '检索级', name: 'Recall@10', score: 0.82, description: '检索结果的相关性和召回率' },
      { layer: '生成级', name: '忠实度', score: 0.92, description: '生成答案与检索结果的一致性' },
      { layer: '端到端', name: '综合评分', score: 0.86, description: '整体系统的综合表现' },
    ],
  };

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['eval-dashboard', period],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboardData;
    },
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
    return null;
  };

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'up') return '#52c41a';
    if (trend === 'down' && Math.abs(change) > 0) return '#52c41a';
    if (trend === 'down') return '#ff4d4f';
    return '#999';
  };

  const getTrendChartOption = () => {
    if (!dashboard) return {};

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['忠实度', '上下文精确度', '答案相关性', '幻觉率'],
      },
      xAxis: {
        type: 'category',
        data: dashboard.trend_data.map((d) => d.date.slice(5)),
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
      },
      series: [
        {
          name: '忠实度',
          type: 'line',
          data: dashboard.trend_data.map((d) => d.faithfulness),
          smooth: true,
        },
        {
          name: '上下文精确度',
          type: 'line',
          data: dashboard.trend_data.map((d) => d.context_precision),
          smooth: true,
        },
        {
          name: '答案相关性',
          type: 'line',
          data: dashboard.trend_data.map((d) => d.answer_relevancy),
          smooth: true,
        },
        {
          name: '幻觉率',
          type: 'line',
          data: dashboard.trend_data.map((d) => d.hallucination_rate),
          smooth: true,
        },
      ],
    };
  };

  const handleCreateTask = async (values: Record<string, unknown>) => {
    try {
      message.success('评测任务创建成功');
      setCreateTaskModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('评测任务创建失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>评测中心</h2>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 120 }}
            options={[
              { label: '近7天', value: '7d' },
              { label: '近30天', value: '30d' },
              { label: '近90天', value: '90d' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateTaskModalVisible(true)}>
            创建评测任务
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <Card loading />
      ) : dashboard && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="忠实度 (Faithfulness)"
                  value={dashboard.metrics.faithfulness.value}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={getTrendIcon(dashboard.metrics.faithfulness.trend)}
                  suffix={
                    <span style={{ fontSize: 14, color: getTrendColor(dashboard.metrics.faithfulness.trend, dashboard.metrics.faithfulness.change) }}>
                      {dashboard.metrics.faithfulness.change > 0 ? '+' : ''}{(dashboard.metrics.faithfulness.change * 100).toFixed(1)}%
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="上下文精确度 (Context Precision)"
                  value={dashboard.metrics.context_precision.value}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={getTrendIcon(dashboard.metrics.context_precision.trend)}
                  suffix={
                    <span style={{ fontSize: 14, color: getTrendColor(dashboard.metrics.context_precision.trend, dashboard.metrics.context_precision.change) }}>
                      {dashboard.metrics.context_precision.change > 0 ? '+' : ''}{(dashboard.metrics.context_precision.change * 100).toFixed(1)}%
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="答案相关性 (Answer Relevancy)"
                  value={dashboard.metrics.answer_relevancy.value}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={getTrendIcon(dashboard.metrics.answer_relevancy.trend)}
                  suffix={
                    <span style={{ fontSize: 14, color: getTrendColor(dashboard.metrics.answer_relevancy.trend, dashboard.metrics.answer_relevancy.change) }}>
                      {dashboard.metrics.answer_relevancy.change > 0 ? '+' : ''}{(dashboard.metrics.answer_relevancy.change * 100).toFixed(1)}%
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="幻觉率 (Hallucination Rate)"
                  value={dashboard.metrics.hallucination_rate.value}
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={getTrendIcon(dashboard.metrics.hallucination_rate.trend)}
                  suffix={
                    <span style={{ fontSize: 14, color: getTrendColor(dashboard.metrics.hallucination_rate.trend, dashboard.metrics.hallucination_rate.change) }}>
                      {dashboard.metrics.hallucination_rate.change > 0 ? '+' : ''}{(dashboard.metrics.hallucination_rate.change * 100).toFixed(1)}%
                    </span>
                  }
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title="核心指标趋势" extra={<Select defaultValue="week" options={[{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }]} />}>
                <ReactECharts option={getTrendChartOption()} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="分层评测">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {dashboard.layered_eval.map((item) => (
                    <div key={item.layer}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{item.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{(item.score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress
                        percent={item.score * 100}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        showInfo={false}
                      />
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.description}</div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Modal
        title="创建评测任务"
        open={createTaskModalVisible}
        onCancel={() => setCreateTaskModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            label="评测名称"
            name="name"
            rules={[{ required: true, message: '请输入评测名称' }]}
          >
            <input placeholder="6月Faithfulness回归评测" />
          </Form.Item>

          <Form.Item
            label="目标知识库"
            name="kb_id"
            rules={[{ required: true, message: '请选择目标知识库' }]}
          >
            <Select placeholder="选择知识库">
              <Select.Option value="kb-001">法务合同知识库</Select.Option>
              <Select.Option value="kb-002">财务报告知识库</Select.Option>
              <Select.Option value="kb-003">研发文档知识库</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="评测集"
            name="eval_set"
            initialValue="default"
          >
            <Select>
              <Select.Option value="default">使用默认评测集</Select.Option>
              <Select.Option value="upload">上传自定义评测集</Select.Option>
              <Select.Option value="generate">从历史查询生成</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="评测指标"
            name="metrics"
            initialValue={['faithfulness', 'context_precision', 'answer_relevancy']}
          >
            <Select mode="multiple" placeholder="选择评测指标">
              <Select.Option value="faithfulness">忠实度</Select.Option>
              <Select.Option value="context_precision">上下文精确度</Select.Option>
              <Select.Option value="answer_relevancy">答案相关性</Select.Option>
              <Select.Option value="hallucination">幻觉率</Select.Option>
              <Select.Option value="context_recall">上下文召回率</Select.Option>
              <Select.Option value="bleu_score">BLEU分数</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="基线对比"
            name="baseline_comparison"
            valuePropName="checked"
          >
            <input type="checkbox" />
            与上次评测结果对比
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
import { Space, Tag, theme } from 'antd';

export function StatusBar() {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        height: 32,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        fontSize: 12,
        color: token.colorTextSecondary,
      }}
    >
      <Space size="middle">
        <Space size={4}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#52c41a',
              display: 'inline-block',
            }}
          />
          <span>已连接</span>
        </Space>
        <Tag color="blue">DEV</Tag>
        <span>v1.0.0</span>
      </Space>
      <span>API 耗时: 120ms</span>
    </div>
  );
}

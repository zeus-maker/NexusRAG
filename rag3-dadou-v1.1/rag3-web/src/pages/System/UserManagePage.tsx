import { useState } from 'react';
import { Table, Button, Input, Select, Space, Card, Tag, Dropdown, Modal, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@/types/system';

export default function UserManagePage() {
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 模拟用户数据
  const mockUsers: User[] = [
    {
      user_id: 'user-001',
      username: 'zhangwei',
      email: 'zhang.wei@example.com',
      full_name: '张伟',
      department: '法务部',
      role_id: 'role-001',
      role_name: '知识库管理员',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      last_login: '2026-06-06T10:30:00Z',
    },
    {
      user_id: 'user-002',
      username: 'liting',
      email: 'li.ting@example.com',
      full_name: '李婷',
      department: 'AI平台',
      role_id: 'role-002',
      role_name: '平台管理员',
      status: 'active',
      created_at: '2026-01-15T00:00:00Z',
      last_login: '2026-06-06T09:45:00Z',
    },
    {
      user_id: 'user-003',
      username: 'chengong',
      email: 'chen.gong@example.com',
      full_name: '陈工',
      department: '算法组',
      role_id: 'role-003',
      role_name: '开发者',
      status: 'active',
      created_at: '2026-02-01T00:00:00Z',
      last_login: '2026-06-05T16:20:00Z',
    },
    {
      user_id: 'user-004',
      username: 'wangfang',
      email: 'wang.fang@example.com',
      full_name: '王芳',
      department: '知识管理',
      role_id: 'role-001',
      role_name: '知识库管理员',
      status: 'active',
      created_at: '2026-03-01T00:00:00Z',
      last_login: '2026-06-04T14:15:00Z',
    },
  ];

  // 模拟API调用
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchText, roleFilter, statusFilter],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = mockUsers;
      
      if (searchText) {
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase()) ||
          user.full_name.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role_id === roleFilter);
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === statusFilter);
      }
      
      return filtered;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'disabled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '未激活';
      case 'disabled':
        return '已禁用';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: User) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{record.full_name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>@{username}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '角色',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (roleName: string) => <Tag color="blue">{roleName}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record.user_id)}
          >
            重置密码
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.user_id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreateUser = () => {
    setCreateModalVisible(true);
  };

  const handleResetPassword = (userId: string) => {
    Modal.confirm({
      title: '确认重置密码',
      content: '确定要重置该用户的密码吗？新密码将通过邮件发送。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('密码重置成功，新密码已发送至用户邮箱');
      },
    });
  };

  const handleDelete = (userId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该用户吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('用户删除成功');
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
          添加用户
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Input.Search
              placeholder="搜索用户名/邮箱/姓名..."
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              style={{ width: 120 }}
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { label: '全部角色', value: 'all' },
                { label: '平台管理员', value: 'role-002' },
                { label: '知识库管理员', value: 'role-001' },
                { label: '开发者', value: 'role-003' },
              ]}
            />
            <Select
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '活跃', value: 'active' },
                { label: '未激活', value: 'inactive' },
                { label: '已禁用', value: 'disabled' },
              ]}
            />
          </Space>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        loading={isLoading}
        rowKey="user_id"
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title="添加用户"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => {
          message.success('用户添加成功');
          setCreateModalVisible(false);
        }}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 16, color: '#999' }}>
            此处为演示，实际应用中需要填写完整的用户信息表单
          </p>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>用户名 *</label>
              <Input placeholder="请输入用户名" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>邮箱 *</label>
              <Input placeholder="请输入邮箱" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>姓名 *</label>
              <Input placeholder="请输入姓名" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>部门 *</label>
              <Select style={{ width: '100%' }} placeholder="请选择部门">
                <Select.Option value="legal">法务部</Select.Option>
                <Select.Option value="ai">AI平台</Select.Option>
                <Select.Option value="algorithm">算法组</Select.Option>
                <Select.Option value="km">知识管理</Select.Option>
              </Select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>角色 *</label>
              <Select style={{ width: '100%' }} placeholder="请选择角色">
                <Select.Option value="role-001">知识库管理员</Select.Option>
                <Select.Option value="role-002">平台管理员</Select.Option>
                <Select.Option value="role-003">开发者</Select.Option>
              </Select>
            </div>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
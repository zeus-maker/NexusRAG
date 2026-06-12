import { useState } from 'react';
import {
  Plus, Search, MoreHorizontal, Shield,
  AlertCircle, CheckCircle, Download, Settings,
  Users
} from 'lucide-react';
import { useApiMode } from '../services/http';
import { mockUsers, mockAuditLogs } from '../mockData';
import { useAdminUsers, useAdminRoles } from '../hooks/useSystemData';

export { MonitorPage } from './MonitorPage';

export function UserManagePage() {
  const apiMode = useApiMode();
  const { data: apiUsers, loading, error } = useAdminUsers();
  const users = apiMode ? apiUsers : mockUsers;
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');

  const filtered = users.filter(u => {
    const matchSearch = u.display_name.includes(search) || u.email.includes(search);
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const statusConfig = {
    active: { label: '活跃', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    disabled: { label: '已禁用', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
    locked: { label: '已锁定', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">用户管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理平台用户账号与权限</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> 添加用户
        </button>
      </div>

      {/* Stats */}
      {error && apiMode && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总用户数', value: loading && apiMode ? '…' : users.length, icon: <Users size={15} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: '活跃用户', value: loading && apiMode ? '…' : users.filter(u => u.status === 'active').length, icon: <CheckCircle size={15} className="text-green-500" />, bg: 'bg-green-50' },
          { label: '已禁用', value: loading && apiMode ? '…' : users.filter(u => u.status === 'disabled').length, icon: <AlertCircle size={15} className="text-gray-500" />, bg: 'bg-gray-50' },
          { label: '角色类型', value: 5, icon: <Shield size={15} className="text-purple-500" />, bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <div className={`${s.bg} p-2 rounded-lg`}>{s.icon}</div>
            <div>
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名或邮箱..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="flex gap-1.5">
          {[{ v: 'all', l: '全部角色' }, { v: '平台管理员', l: '平台管理员' }, { v: '知识库管理员', l: 'KB管理员' }, { v: '开发者', l: '开发者' }].map(f => (
            <button key={f.v} onClick={() => setSelectedRole(f.v)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedRole === f.v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">用户</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">邮箱</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">部门</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">角色</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">最后登录</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const sc = statusConfig[user.status];
              return (
                <tr key={user.user_id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">{user.display_name[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{user.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{user.last_login.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400"><MoreHorizontal size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">添加用户</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">姓名</label><input placeholder="输入姓名" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">企业邮箱</label><input type="email" placeholder="user@corp.com" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">部门</label><input placeholder="所属部门" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">角色</label>
                  <select className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                    <option>普通用户</option><option>知识库管理员</option><option>开发者</option><option>平台管理员</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">添加用户</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoleManagePage() {
  const apiMode = useApiMode();
  const { data: apiRoles } = useAdminRoles();
  const roleIcons: Record<string, string> = {
    admin: '👑', kb_admin: '📚', developer: '💻', user: '👤',
  };
  const roleColors = ['bg-red-50 border-red-200 text-red-700', 'bg-blue-50 border-blue-200 text-blue-700', 'bg-purple-50 border-purple-200 text-purple-700', 'bg-green-50 border-green-200 text-green-700'];
  const roles = apiMode && apiRoles.length
    ? apiRoles.map((r, i) => ({
        name: r.name,
        users: r.userCount,
        color: roleColors[i % roleColors.length].split(' ')[0] + ' ' + roleColors[i % roleColors.length].split(' ')[1],
        textColor: roleColors[i % roleColors.length].split(' ')[2],
        icon: roleIcons[r.id] || '⚙️',
      }))
    : [
    { name: '超级管理员', users: 1, color: 'bg-red-50 border-red-200', textColor: 'text-red-700', icon: '👑' },
    { name: '平台管理员', users: 2, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700', icon: '⚙️' },
    { name: '知识库管理员', users: 5, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', icon: '📚' },
    { name: '开发者', users: 8, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700', icon: '💻' },
    { name: '普通用户', users: 45, color: 'bg-green-50 border-green-200', textColor: 'text-green-700', icon: '👤' },
    { name: '法务主管', users: 2, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700', icon: '⚖️' },
  ];

  const aclRules = [
    { name: '高管可看全部', subject: 'executive', condition: 'confidentiality IN (public, internal, confidential, restricted)', enabled: true },
    { name: '财务分析师可看内部及以下', subject: 'finance_analyst', condition: 'confidentiality != restricted', enabled: true },
    { name: '实习生仅可看公开', subject: 'intern', condition: 'confidentiality == public', enabled: true },
  ];

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">角色权限</h1>
          <p className="text-sm text-gray-500 mt-0.5">基于角色的访问控制 (RBAC) 配置</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> 创建角色
        </button>
      </div>

      {/* Roles grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">系统角色</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {roles.map(role => (
            <div key={role.name} className={`${role.color} border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all`}>
              <div className="text-2xl mb-2">{role.icon}</div>
              <div className={`text-xs font-semibold ${role.textColor}`}>{role.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{role.users} 人</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACL rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Chunk 级 ACL 规则</h3>
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Plus size={12} /> 添加规则
          </button>
        </div>
        <div className="space-y-2">
          {aclRules.map((rule, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500">#{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-900">{rule.name}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div><span className="text-gray-400">被授权者：</span>角色 = {rule.subject}</div>
                    <div><span className="text-gray-400">条件：</span><code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{rule.condition}</code></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已启用</span>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400"><Settings size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { PipelineConfigPage } from './PipelineConfigPage';

export function AuditLogPage() {
  const apiMode = useApiMode();
  const [search, setSearch] = useState('');
  const { data: apiLogs, loading, error, refresh } = useAdminAuditLogs(search);
  const logs = apiMode ? apiLogs : mockAuditLogs;
  const filtered = logs.filter(l => !search || l.user_name.includes(search) || l.action.includes(search) || l.resource.includes(search));

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">审计日志</h1>
          <p className="text-sm text-gray-500 mt-0.5">记录所有用户操作与系统事件</p>
        </div>
        <button type="button" onClick={() => apiMode && refresh()} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
          <Download size={14} /> {apiMode ? '刷新' : '导出 CSV'}
        </button>
      </div>
      {error && apiMode && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>时间：</span>
          <input type="date" defaultValue="2026-06-01" className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none" />
          <span>~</span>
          <input type="date" defaultValue="2026-06-06" className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户、操作、资源..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">用户</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">资源</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">IP</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">结果</th>
            </tr>
          </thead>
          <tbody>
            {(loading && apiMode ? [] : filtered).map(log => (
              <tr key={log.log_id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.timestamp}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-600">{log.user_name[0]}</span>
                    </div>
                    <span className="text-xs text-gray-800">{log.user_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{log.action}</td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell font-mono">{log.resource}</td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell font-mono">{log.ip}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${log.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.result === 'success' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {log.result === 'success' ? '成功' : '失败'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


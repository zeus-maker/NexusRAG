import { useState } from 'react';
import {
  GitBranch, FileText, CheckCircle, AlertCircle, ChevronRight, ChevronDown,
  Search, Eye, RefreshCw, Folder, FolderOpen,
} from 'lucide-react';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, BtnSecondary } from '../../components/hubUi';

interface PageIndexHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: any) => void;
}

const tabs = ['概览', '文档列表', '单文档树'];

const mockDocuments = [
  { id: '1', name: '合同模板V5.pdf', treeStatus: 'completed' as const, nodes: 86, depth: 4, updated: '2小时前' },
  { id: '2', name: '采购协议条款.pdf', treeStatus: 'completed' as const, nodes: 64, depth: 3, updated: '1天前' },
  { id: '3', name: '保密协议合集.pdf', treeStatus: 'building' as const, nodes: 32, depth: 2, updated: '刚刚' },
  { id: '4', name: '供应商管理规范.docx', treeStatus: 'failed' as const, nodes: 0, depth: 0, updated: '3天前' },
  { id: '5', name: '财务报告Q3.xlsx', treeStatus: 'completed' as const, nodes: 45, depth: 3, updated: '5天前' },
];

const mockTree = {
  title: '合同模板V5.pdf',
  children: [
    {
      title: '1. 总则',
      children: [
        { title: '1.1 适用范围', children: [] },
        { title: '1.2 定义与解释', children: [
          { title: '1.2.1 供应商定义', children: [] },
          { title: '1.2.2 违约定义', children: [] },
        ] },
      ],
    },
    {
      title: '5. 违约责任',
      children: [
        { title: '5.1 迟延交货', children: [
          { title: '5.1.1 违约金计算', children: [] },
        ] },
      ],
    },
  ],
};

const docStatusBadge = {
  completed: { variant: 'active' as const, label: '已建树' },
  building: { variant: 'indexing' as const, label: '建树中' },
  failed: { variant: 'error' as const, label: '失败' },
};

function TreeNode({ node, depth = 0 }: { node: { title: string; children: any[] }; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(p => !p)}
      >
        {hasChildren ? (
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        ) : <div className="w-3.5" />}
        {hasChildren ? (
          expanded ? <FolderOpen size={14} className="text-cyan-600" /> : <Folder size={14} className="text-cyan-500" />
        ) : (
          <FileText size={14} className="text-gray-400 group-hover:text-blue-500" />
        )}
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{node.title}</span>
      </div>
      {expanded && hasChildren && node.children.map((child, idx) => (
        <TreeNode key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function PageIndexHubPage({ kbId, onNavigate }: PageIndexHubPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <HubPageShell
      title="PageIndex Hub"
      subtitle="文档树索引管理 · 建树率 54.5% (85/156)"
      icon={<GitBranch size={16} className="text-cyan-600" />}
      badge={{ label: '85/156 已建树', variant: 'active' }}
      onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || 'kb-001' })}
      secondaryAction={{ label: '重建失败项', icon: <RefreshCw size={14} />, onClick: () => alert('重建失败项任务已提交（模拟）') }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 0 && <OverviewTab />}
      {activeTab === 1 && <DocumentsTab />}
      {activeTab === 2 && <TreeTab />}
    </HubPageShell>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="已建树" value="85" icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="建树中" value="12" icon={<RefreshCw size={18} className="text-yellow-500" />} />
        <HubStatCard label="失败" value="12" icon={<AlertCircle size={18} className="text-red-500" />} />
        <HubStatCard label="总节点数" value="6.8K" icon={<GitBranch size={18} className="text-cyan-600" />} />
      </div>
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">建树进度</h3>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-500" style={{ width: '54.5%' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>85/156 文档已完成</span>
          <span>54.5%</span>
        </div>
      </div>
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" /> 失败原因分布
        </h3>
        <div className="space-y-2">
          {[
            { reason: 'PDF 扫描件无法解析', count: 5, color: 'bg-red-500' },
            { reason: '表格结构提取失败', count: 4, color: 'bg-yellow-500' },
            { reason: '页面为空/无内容', count: 2, color: 'bg-purple-500' },
          ].map(item => (
            <div key={item.reason} className="flex items-center gap-3">
              <span className="flex-1 text-xs text-gray-600">{item.reason}</span>
              <span className="text-xs text-gray-500 w-6 text-right">{item.count}</span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab() {
  const [search, setSearch] = useState('');
  const filtered = mockDocuments.filter(d => d.name.includes(search));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档..." className={`${hubInput} pl-9`} />
      </div>
      <div className="space-y-2">
        {filtered.map(doc => (
          <div key={doc.id} className={`${hubCard} p-4 hover:border-blue-300 cursor-pointer group`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400 group-hover:text-cyan-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                  <p className="text-xs text-gray-500">
                    {doc.nodes > 0 ? `${doc.nodes} 节点 · 深度 ${doc.depth}` : '未建树'} · {doc.updated}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HubBadge variant={docStatusBadge[doc.treeStatus].variant}>{docStatusBadge[doc.treeStatus].label}</HubBadge>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className={`${hubCard} p-4 lg:col-span-3`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <GitBranch size={16} className="text-cyan-600" /> 文档树结构
        </h3>
        <div className="border border-gray-100 rounded-lg p-2 bg-gray-50/50">
          <TreeNode node={mockTree} />
        </div>
      </div>
      <div className={`${hubCard} p-4 lg:col-span-2`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">节点详情</h3>
        <div className="space-y-3 text-sm">
          <div><p className="text-xs text-gray-500 mb-0.5">当前选中</p><p className="text-gray-900 font-medium">5.1.1 违约金计算</p></div>
          <div><p className="text-xs text-gray-500 mb-0.5">层级深度</p><p className="text-gray-800">3</p></div>
          <div><p className="text-xs text-gray-500 mb-0.5">关联块数</p><p className="text-gray-800">24</p></div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">内容预览</p>
            <p className="text-xs text-gray-600 leading-relaxed">供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金...</p>
          </div>
          <BtnSecondary className="w-full justify-center" onClick={() => alert('完整内容查看（模拟）')}>
            <Eye size={12} /> 查看完整内容
          </BtnSecondary>
        </div>
      </div>
    </div>
  );
}

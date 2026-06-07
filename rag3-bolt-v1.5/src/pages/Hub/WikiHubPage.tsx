import { useState } from 'react';
import {
  BookOpen, FileText, CheckCircle, Clock, ChevronRight, Search, Plus,
  Eye, Settings, RefreshCw,
} from 'lucide-react';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary } from '../../components/hubUi';

interface WikiHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: any) => void;
}

const tabs = ['浏览器', '编译队列', '编译设置', '统计'];

const mockPages = [
  { id: '1', title: '违约金计算规则', status: 'published' as const, version: 'v3.2', updated: '2小时前', views: 342, author: '李婷' },
  { id: '2', title: '供应商评级标准', status: 'published' as const, version: 'v2.1', updated: '1天前', views: 189, author: '王磊' },
  { id: '3', title: '合同审批流程', status: 'review' as const, version: 'v1.0-draft', updated: '3小时前', views: 0, author: '张敏' },
  { id: '4', title: '采购订单规范', status: 'review' as const, version: 'v1.0-draft', updated: '5小时前', views: 0, author: '李婷' },
  { id: '5', title: '付款条款汇总', status: 'compiling' as const, version: 'v2.0', updated: '刚刚', views: 56, author: '王磊' },
  { id: '6', title: '保密协议模板', status: 'compiling' as const, version: 'v1.5', updated: '刚刚', views: 78, author: '张敏' },
];

const statusBadge = {
  published: { variant: 'active' as const, label: '已发布' },
  review: { variant: 'indexing' as const, label: '待审核' },
  compiling: { variant: 'indexing' as const, label: '编译中' },
};

export default function WikiHubPage({ kbId, onNavigate }: WikiHubPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <HubPageShell
      title="Wiki Hub"
      subtitle="LLM Wiki 知识库管理 · 12/42 页面已发布"
      icon={<BookOpen size={16} className="text-violet-500" />}
      badge={{ label: '2 编译中', variant: 'indexing' }}
      onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || 'kb-001' })}
      primaryAction={{ label: '新建页面', icon: <Plus size={14} />, onClick: () => alert('新建 Wiki 页面（模拟）') }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 0 && <BrowserTab />}
      {activeTab === 1 && <CompileQueueTab />}
      {activeTab === 2 && <CompileSettingsTab />}
      {activeTab === 3 && <StatsTab />}
    </HubPageShell>
  );
}

function BrowserTab() {
  const [search, setSearch] = useState('');
  const filtered = mockPages.filter(p => p.title.includes(search));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 Wiki 页面..." className={`${hubInput} pl-9`} />
      </div>
      <div className="space-y-2">
        {filtered.map(page => (
          <div key={page.id} className={`${hubCard} p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer group`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400 group-hover:text-violet-500 transition-colors" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{page.title}</h3>
                  <p className="text-xs text-gray-500">{page.version} · {page.author} · {page.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12} /> {page.views}</span>
                <HubBadge variant={statusBadge[page.status].variant}>{statusBadge[page.status].label}</HubBadge>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompileQueueTab() {
  const queue = [
    { id: '1', title: '付款条款汇总', status: 'compiling' as const, progress: 65, step: 'Chunking & Embedding', started: '3分钟前' },
    { id: '2', title: '保密协议模板', status: 'compiling' as const, progress: 30, step: 'LLM Extraction', started: '5分钟前' },
    { id: '3', title: '合同审批流程', status: 'queued' as const, progress: 0, step: '等待中', started: '-' },
  ];

  return (
    <div className="space-y-3">
      {queue.map(item => (
        <div key={item.id} className={`${hubCard} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
            </div>
            <HubBadge variant={item.status === 'compiling' ? 'indexing' : 'draft'}>
              {item.status === 'compiling' ? '编译中' : '排队中'}
            </HubBadge>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${item.progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{item.step}</span>
            <span>{item.started} · {item.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompileSettingsTab() {
  const [autoPublish, setAutoPublish] = useState(true);

  return (
    <div className={`${hubCard} p-5 max-w-lg`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings size={16} className="text-gray-500" /> 编译配置
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">提取模型</label>
          <select className={hubSelect} defaultValue="gpt4o">
            <option value="gpt4o">GPT-4o (推荐)</option>
            <option>Claude 3.5 Sonnet</option>
            <option>Qwen-Max</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">编译模式</label>
          <select className={hubSelect} defaultValue="incremental">
            <option value="incremental">增量编译</option>
            <option>全量重编译</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoPublish(p => !p)}
            className={`w-11 h-6 rounded-full relative transition-colors ${autoPublish ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${autoPublish ? 'left-6' : 'left-1'}`} />
          </button>
          <span className="text-sm text-gray-700">编译完成后自动发布</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">审核要求</label>
          <select className={hubSelect} defaultValue="manual">
            <option value="manual">需人工审核</option>
            <option>自动审核通过</option>
          </select>
        </div>
        <BtnPrimary className="w-full justify-center" onClick={() => alert('配置已保存')}>保存配置</BtnPrimary>
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="已发布页面" value="12/42" icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="待审核" value="3" icon={<Clock size={18} className="text-yellow-500" />} />
        <HubStatCard label="编译中" value="2" icon={<RefreshCw size={18} className="text-blue-500" />} />
        <HubStatCard label="总浏览量" value="4.2K" icon={<Eye size={18} className="text-purple-500" />} />
      </div>
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">编译趋势 (近7天)</h3>
        <div className="flex items-end gap-2 h-28">
          {[12, 8, 15, 6, 18, 10, 14].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${(val / 20) * 100}%`, minHeight: 4 }} />
              <span className="text-[10px] text-gray-400">{['一', '二', '三', '四', '五', '六', '日'][idx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

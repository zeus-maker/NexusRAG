import { useState } from 'react';
import {
  Plus, Search, MoreHorizontal, Database, FileText,
  Cpu, Clock, TrendingUp, ArrowRight, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import { mockKBs, mockDocuments, mockChunks, mockIndexStatuses } from '../mockData';

const statusConfig = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  indexing: { label: '索引中', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500 animate-pulse' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function formatTime(iso: string) {
  const now = new Date('2026-06-05T12:00:00Z').getTime();
  const t = new Date(iso).getTime();
  const diff = now - t;
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  return Math.floor(diff / 86400000) + ' 天前';
}

interface KBListPageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function KBListPage({ onNavigate }: KBListPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = mockKBs.filter(kb => {
    const matchSearch = kb.name.includes(search) || kb.description.includes(search);
    const matchStatus = statusFilter === 'all' || kb.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">知识库管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理您的企业知识库，上传文档、配置索引策略</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          创建知识库
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '知识库总数', value: mockKBs.length, icon: <Database size={16} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: '文档总数', value: mockKBs.reduce((s, k) => s + k.doc_count, 0).toLocaleString(), icon: <FileText size={16} className="text-purple-500" />, bg: 'bg-purple-50' },
          { label: 'Chunk 总数', value: mockKBs.reduce((s, k) => s + k.chunk_count, 0).toLocaleString(), icon: <Cpu size={16} className="text-orange-500" />, bg: 'bg-orange-50' },
          { label: '存储总量', value: formatBytes(mockKBs.reduce((s, k) => s + k.total_size_bytes, 0)), icon: <TrendingUp size={16} className="text-green-500" />, bg: 'bg-green-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
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
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索知识库名称或描述..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-1.5">
          {[{ v: 'all', l: '全部' }, { v: 'active', l: '活跃' }, { v: 'indexing', l: '索引中' }, { v: 'archived', l: '已归档' }].map(f => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${statusFilter === f.v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* KB Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(kb => {
          const sc = statusConfig[kb.status];
          return (
            <div
              key={kb.kb_id}
              onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group relative"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">{kb.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-700 transition-colors">{kb.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                      {sc.label}
                    </span>
                  </div>
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenu(openMenu === kb.kb_id ? null : kb.kb_id)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenu === kb.kb_id && (
                    <div className="absolute right-0 top-6 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                      {[
                        { icon: <Edit size={13} />, label: '编辑设置', action: () => {} },
                        { icon: <ArrowRight size={13} />, label: '查看文档', action: () => onNavigate('kb-documents', { selectedKBId: kb.kb_id }) },
                        { icon: <RefreshCw size={13} />, label: '重建索引', action: () => {} },
                        { icon: <Trash2 size={13} />, label: '删除', action: () => {}, danger: true },
                      ].map((m, i) => (
                        <button
                          key={i}
                          onClick={() => { m.action(); setOpenMenu(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${(m as any).danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {m.icon}{m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{kb.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-gray-900">{kb.doc_count}</div>
                  <div className="text-[10px] text-gray-500">文档</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-gray-900">{(kb.chunk_count / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-gray-500">Chunk</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                <span>{formatBytes(kb.total_size_bytes)}</span>
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>更新 {formatTime(kb.updated_at)}</span>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={14} className="text-blue-500" />
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <div
          onClick={() => setShowCreate(true)}
          className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group min-h-48"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Plus size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-blue-700 font-medium transition-colors">创建新知识库</span>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">创建知识库</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">知识库名称 <span className="text-red-500">*</span></label>
                <input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="输入知识库名称（2-50字符）"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="输入描述（选填，最多200字符）"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">默认语言</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none">
                    <option>中文</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">分块策略</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none">
                    <option>通用分块</option>
                    <option>表格优先</option>
                    <option>代码感知</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">嵌入模型</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none">
                    <option>BAAI/bge-m3</option>
                    <option>BCE-Embedding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LLM 模型</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none">
                    <option>DeepSeek-v4</option>
                    <option>Qwen3-72B</option>
                    <option>Claude-4</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">取消</button>
              <button
                onClick={() => setShowCreate(false)}
                disabled={!createName}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KBDetailPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function KBDetailPage({ kbId, onNavigate }: KBDetailPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const [tab, setTab] = useState<'overview' | 'documents' | 'index' | 'settings'>('overview');

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'documents', label: '文档' },
    { key: 'index', label: '索引状态' },
    { key: 'settings', label: '设置' },
  ] as const;

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('kb-list')} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          ← 返回
        </button>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{kb.icon}</span>
          <h1 className="text-lg font-bold text-gray-900">{kb.name}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[kb.status].color}`}>{statusConfig[kb.status].label}</span>
        </div>
        <button
          onClick={() => onNavigate('kb-documents', { selectedKBId: kb.kb_id })}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
        >
          <FileText size={14} /> 管理文档
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { if (t.key === 'documents') onNavigate('kb-documents', { selectedKBId: kb.kb_id }); else if (t.key === 'index') onNavigate('kb-index-status', { selectedKBId: kb.kb_id }); else setTab(t.key as any); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key && t.key !== 'documents' && t.key !== 'index' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '文档总数', value: kb.doc_count, icon: '📄', color: 'bg-blue-50 text-blue-700' },
          { label: 'Chunk 数', value: kb.chunk_count.toLocaleString(), icon: '📦', color: 'bg-purple-50 text-purple-700' },
          { label: '存储大小', value: formatBytes(kb.total_size_bytes), icon: '💾', color: 'bg-green-50 text-green-700' },
          { label: '解析质量', value: '92.5', icon: '⭐', color: 'bg-amber-50 text-amber-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Query trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">近30天查询趋势</h3>
          <div className="flex items-end gap-1 h-24">
            {[28, 35, 22, 45, 38, 52, 31, 48, 55, 42, 60, 38, 44, 58, 67, 52, 48, 71, 63, 58, 74, 68, 55, 82, 76, 69, 85, 79, 88, 92].map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${(v / 92) * 100}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>5月7日</span>
            <span>今日 92 次</span>
          </div>
        </div>

        {/* Doc type distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">文档类型分布</h3>
          <div className="space-y-2">
            {[
              { type: 'PDF', count: 85, color: 'bg-red-500', pct: 85 },
              { type: 'DOCX', count: 42, color: 'bg-blue-500', pct: 42 },
              { type: 'XLSX', count: 18, color: 'bg-green-500', pct: 18 },
              { type: '其他', count: 11, color: 'bg-gray-400', pct: 11 },
            ].map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-8">{d.type}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }}></div>
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent uploads & top queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">最近上传</h3>
          <div className="space-y-2">
            {[
              { name: '合同模板V6.pdf', time: '2小时前', type: 'PDF' },
              { name: '审计报告.pdf', time: '1天前', type: 'PDF' },
              { name: '财务数据.xlsx', time: '2天前', type: 'XLSX' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileText size={13} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{f.name}</div>
                  <div className="text-[10px] text-gray-400">{f.type} · {f.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">高频查询</h3>
          <div className="space-y-2">
            {[
              { query: '供应商违约金条款', count: 143 },
              { query: '知识产权归属模板', count: 98 },
              { query: '合同解除条件', count: 76 },
              { query: '保密协议有效期', count: 64 },
            ].map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-800 truncate">{q.query}</div>
                </div>
                <span className="text-xs text-blue-600 font-medium flex-shrink-0">{q.count}次</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DocumentPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function DocumentPage({ kbId, onNavigate }: DocumentPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const parseStatusConfig = {
    pending: { label: '等待中', color: 'bg-gray-100 text-gray-600', icon: <Clock size={11} /> },
    parsing: { label: '解析中', color: 'bg-blue-100 text-blue-700', icon: <Loader size={11} className="animate-spin" /> },
    parsed: { label: '已解析', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={11} /> },
    failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={11} /> },
  };

  const filtered = mockDocuments.filter(d => d.kb_id === kbId && d.original_name.includes(search));

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-bold text-gray-900">{kb.name} · 文档管理</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            🔗 URL导入
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 上传文档
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm font-medium text-gray-700">拖拽文件至此处，或点击选择文件</p>
        <p className="text-xs text-gray-500 mt-1">支持 PDF / DOCX / PPTX / XLSX / CSV / TXT / MD / HTML 等16+格式 · 单文件上限 100MB · 批量上传最多100个</p>
      </div>

      {/* Upload queue simulation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">上传队列 (2/3)</span>
          <button className="text-xs text-gray-500 hover:text-gray-700">清空已完成</button>
        </div>
        {[
          { name: '合同模板V6.pdf', size: '2.3 MB', progress: 100, status: 'done' },
          { name: '审计报告.pdf', size: '5.0 MB', progress: 58, status: 'parsing' },
          { name: '数据表.xlsx', size: '1.2 MB', progress: 22, status: 'uploading' },
        ].map((f, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50 last:border-0">
            <FileText size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{f.size}</span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              <div className={`h-full rounded-full transition-all ${f.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${f.progress}%` }}></div>
            </div>
            <span className={`text-[10px] flex-shrink-0 ${f.status === 'done' ? 'text-green-600' : f.status === 'parsing' ? 'text-blue-600' : 'text-gray-500'}`}>
              {f.status === 'done' ? '✅完成' : f.status === 'parsing' ? '🔄解析中' : '⬆上传中'}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档名称..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {selectedDocs.length > 0 && (
          <button className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
            <Trash2 size={12} /> 删除选中 ({selectedDocs.length})
          </button>
        )}
      </div>

      {/* Document table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">文件名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">大小</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">质量评分</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden xl:table-cell">上传时间</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => {
              const sc = parseStatusConfig[doc.parse_status];
              return (
                <tr key={doc.doc_id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.doc_id)}
                      onChange={e => setSelectedDocs(p => e.target.checked ? [...p, doc.doc_id] : p.filter(id => id !== doc.doc_id))}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
                      className="flex items-center gap-2 hover:text-blue-700 transition-colors text-left"
                    >
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 hover:text-blue-700 font-medium">{doc.original_name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{doc.file_type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                      {sc.icon}{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {doc.parse_quality_score > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${doc.parse_quality_score >= 90 ? 'bg-green-500' : doc.parse_quality_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${doc.parse_quality_score}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${doc.parse_quality_score >= 90 ? 'text-green-600' : doc.parse_quality_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{doc.parse_quality_score}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">--</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{formatTime(doc.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ChunkPreviewPageProps {
  kbId: string;
  docId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function ChunkPreviewPage({ kbId, docId, onNavigate }: ChunkPreviewPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const doc = mockDocuments.find(d => d.doc_id === docId) || mockDocuments[0];
  const [strategy, setStrategy] = useState('通用分块');
  const [chunkSize, setChunkSize] = useState('512');

  const contentTypeConfig = {
    text: { label: '文本', color: 'bg-gray-100 text-gray-600', icon: '📄' },
    table: { label: '表格', color: 'bg-green-100 text-green-700', icon: '📊' },
    image: { label: '图片', color: 'bg-orange-100 text-orange-700', icon: '🖼️' },
    formula: { label: '公式', color: 'bg-purple-100 text-purple-700', icon: '∑' },
    code: { label: '代码', color: 'bg-blue-100 text-blue-700', icon: '</>' },
  };

  const aclConfig: Record<string, string> = {
    internal: 'bg-yellow-100 text-yellow-700',
    confidential: 'bg-red-100 text-red-700',
    public: 'bg-green-100 text-green-700',
    restricted: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onNavigate('kb-documents', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-48">{doc.original_name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900">分块预览</span>
        </div>
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-gray-700">
          <RefreshCw size={13} /> 重新分块
        </button>
      </div>

      {/* Config row */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">分块策略</span>
          <select value={strategy} onChange={e => setStrategy(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
            <option>通用分块</option>
            <option>模板分块</option>
            <option>表格优先</option>
            <option>代码感知</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Chunk大小</span>
          <select value={chunkSize} onChange={e => setChunkSize(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
            <option>256</option><option>512</option><option>1024</option>
          </select>
        </div>
        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span><strong className="text-gray-800">5</strong> 块</span>
          <span>平均 <strong className="text-gray-800">412</strong> Token</span>
          <span>最大 <strong className="text-gray-800">512</strong></span>
          <span>最小 <strong className="text-gray-800">256</strong></span>
        </div>
      </div>

      {/* Chunks list */}
      <div className="space-y-3">
        {mockChunks.map(chunk => {
          const tc = contentTypeConfig[chunk.content_type];
          return (
            <div key={chunk.chunk_id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-600">#{chunk.chunk_index}</span>
                  <span className="text-xs font-medium text-gray-800">{chunk.section_title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tc.color}`}>{tc.icon} {tc.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${aclConfig[chunk.acl_level] || 'bg-gray-100 text-gray-600'}`}>🔒 {chunk.acl_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{chunk.token_count} Token</span>
                  <span className="text-[10px] text-gray-500">P{chunk.page_number}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                {chunk.content_type === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          {['类型', '计算标准', '上限'].map(h => (
                            <th key={h} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[['交货延迟', '日 0.5%', '20%'], ['质量不合规', '实际损失赔偿', '30%'], ['提前解约', '合同金额15%', '15%']].map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {row.map((cell, j) => (
                              <td key={j} className="border border-gray-200 px-3 py-1.5 text-gray-700">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{chunk.content_preview}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-100">
                <button className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">拆分</button>
                <button className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">合并↓</button>
                <button className="text-[10px] px-2 py-1 border border-red-100 rounded hover:bg-red-50 text-red-600">排除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IndexStatusPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function IndexStatusPage({ kbId, onNavigate }: IndexStatusPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  // mockIndexStatuses imported above
  const statusConfig2 = {
    running: { label: '索引中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
    failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
    paused: { label: '已暂停', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
    not_started: { label: '未开始', color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-bold text-gray-900">{kb.name} · 索引状态</h1>
        </div>
        <button className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1.5">
          <RefreshCw size={13} /> 全部重建索引
        </button>
      </div>

      {/* Index status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {mockIndexStatuses.map((idx: any) => {
          const sc = statusConfig2[idx.status as keyof typeof statusConfig2];
          const pct = Math.round((idx.indexed / idx.total) * 100);
          return (
            <div key={idx.pipeline} className={`${sc.bg} rounded-xl p-4 border border-white/60`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">{idx.label}</span>
                <div className={`w-2 h-2 rounded-full ${sc.dot}`}></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{pct}%</div>
              <div className="text-[10px] text-gray-600 mb-2">{idx.indexed} / {idx.total}</div>
              <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${sc.dot.replace('animate-pulse', '').trim()}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">健康 {idx.health}</span>
                <span className="text-[10px] text-gray-500">{idx.last_updated}</span>
              </div>
              {idx.failed_count > 0 && (
                <button className="mt-2 text-[10px] text-red-600 hover:underline">重试 {idx.failed_count} 失败</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Failed docs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">失败文档</h3>
          <span className="text-xs text-gray-500">共 2 个</span>
        </div>
        {[
          { name: '复杂表格报告.pdf', pipeline: '向量索引', reason: '嵌入请求超时' },
          { name: '扫描件合同.pdf', pipeline: 'PageIndex', reason: 'LLM 解析超时' },
        ].map((f, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
            <FileText size={14} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 font-medium">{f.name}</div>
              <div className="text-xs text-gray-500">{f.pipeline} · {f.reason}</div>
            </div>
            <div className="flex gap-2">
              <button className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">重试</button>
              <button className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">跳过</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

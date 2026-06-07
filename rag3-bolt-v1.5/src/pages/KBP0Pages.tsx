import { useState } from 'react';
import {
  Shield, Database, Download, Plus, Save, ExternalLink, X,
  CheckCircle, Loader2, Trash2, Unlink,
} from 'lucide-react';
import { KBDetailLayout } from '../components/KBDetailLayout';
import {
  DEFAULT_KB_VISIBILITY,
  DEFAULT_KB_ACL_RULES,
  DEFAULT_KB_DATA_SOURCES,
  DEFAULT_EXPORT_TASKS,
  type KBACLRule,
  type KBDataSource,
  type ExportTask,
} from '../data/fusionMock';

interface KBP0PageProps {
  kbId: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

/* ── 权限页 §3.10 ── */

export function KBPermissionsPage({ kbId, onNavigate }: KBP0PageProps) {
  const [visibility, setVisibility] = useState(DEFAULT_KB_VISIBILITY.scope);
  const [rules, setRules] = useState(DEFAULT_KB_ACL_RULES);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-permissions" onNavigate={onNavigate}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" /> 权限管理
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">团队可见性 + Chunk 级 ACL（§3.10）</p>
          </div>
          <button type="button" onClick={() => showToast('权限配置已保存')} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={14} /> 保存
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">团队可见性（RAGFlow permission）</h3>
          <div className="flex flex-wrap gap-4">
            {(['me', 'team'] as const).map(scope => (
              <label key={scope} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="radio" name="visibility" checked={visibility === scope} onChange={() => setVisibility(scope)} />
                {scope === 'me' ? '仅自己 (me)' : '团队 (team)'}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Chunk 级 ACL 规则</h3>
            <button type="button" onClick={() => showToast('添加规则（原型）')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Plus size={12} /> 添加规则
            </button>
          </div>
          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <ACLRuleRow key={rule.id} rule={rule} index={idx + 1} onRemove={() => removeRule(rule.id)} />
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">ACL 效果验证</h3>
            <p className="text-xs text-gray-500 mt-0.5">在系统级 ACL 模拟器中验证规则效果</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sys-security')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-blue-600"
          >
            打开 ACL 模拟器 <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </KBDetailLayout>
  );
}

function ACLRuleRow({ rule, index, onRemove }: { rule: KBACLRule; index: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
      <span className="font-bold text-gray-400 w-6">#{index}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200 flex-1">{rule.name}</span>
      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">角色={rule.role}</span>
      <span className="text-gray-600 dark:text-gray-400">{rule.action}</span>
      <span className="text-gray-500">条件: {rule.condition}</span>
      <button type="button" onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
    </div>
  );
}

/* ── 数据源页 §10.10.1 ── */

export function KBDataSourcesPage({ kbId, onNavigate }: KBP0PageProps) {
  const [sources, setSources] = useState(DEFAULT_KB_DATA_SOURCES);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const unbind = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    showToast('数据源已解绑');
  };

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-data-sources" onNavigate={onNavigate}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Database size={18} className="text-cyan-600" /> 数据源
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">已关联外部数据源与同步计划（§10.10.1）</p>
          </div>
          <button type="button" onClick={() => showToast('关联数据源（原型）')} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 关联数据源
          </button>
        </div>

        <div className="space-y-3">
          {sources.map(ds => (
            <DataSourceCard key={ds.id} source={ds} onUnbind={() => ds.type !== 'Manual' && unbind(ds.id)} />
          ))}
        </div>
      </div>
    </KBDetailLayout>
  );
}

function DataSourceCard({ source, onUnbind }: { source: KBDataSource; onUnbind: () => void }) {
  const typeIcon = { S3: '☁️', Web: '🌐', SharePoint: '📁', Manual: '📤' }[source.type];
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
      <span className="text-2xl">{typeIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{source.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {source.type}
          {source.syncSchedule !== '—' && ` · 同步: ${source.syncSchedule}`}
          {source.lastSync !== '—' && ` · 上次: ${source.lastSync}`}
          {source.docCount != null && ` · ${source.docCount} 文档`}
        </div>
      </div>
      {source.type !== 'Manual' ? (
        <button type="button" onClick={onUnbind} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
          <Unlink size={12} /> 解绑
        </button>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </div>
  );
}

/* ── 导出任务 §3.8 ── */

export function KBExportPage({ kbId, onNavigate }: KBP0PageProps) {
  const [tasks, setTasks] = useState(DEFAULT_EXPORT_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [exportChunk, setExportChunk] = useState(true);
  const [exportMeta, setExportMeta] = useState(true);
  const [exportWiki, setExportWiki] = useState(false);
  const [exportFormat, setExportFormat] = useState('JSONL');
  const [zipCompress, setZipCompress] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const startExport = () => {
    const newTask: ExportTask = {
      id: `exp-${Date.now()}`,
      title: exportScope === 'all' ? '全库导出' : '选中文档导出',
      format: exportFormat,
      scope: exportScope === 'all' ? '全部文档' : '选中文档',
      status: 'running',
      progress: 0,
      createdBy: '当前用户',
      createdAt: '刚刚',
    };
    setTasks(prev => [newTask, ...prev]);
    setShowModal(false);
    showToast('导出任务已创建');
  };

  const cancelTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as const } : t));
    showToast('任务已取消');
  };

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-documents" onNavigate={onNavigate}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Download size={18} className="text-green-600" /> 导出任务
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Chunk / 元数据 / Wiki 批量导出（§3.8）</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 新建导出
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <ExportTaskCard key={task.id} task={task} onCancel={() => cancelTask(task.id)} onDownload={() => showToast('下载已开始（mock）')} />
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">新建导出任务</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-2">导出范围</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={exportScope === 'all'} onChange={() => setExportScope('all')} /> 全部文档</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={exportScope === 'selected'} onChange={() => setExportScope('selected')} /> 选中文档</label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">导出内容</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={exportChunk} onChange={e => setExportChunk(e.target.checked)} /> Chunk</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={exportMeta} onChange={e => setExportMeta(e.target.checked)} /> 元数据</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={exportWiki} onChange={e => setExportWiki(e.target.checked)} /> Wiki</label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">文件格式</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  {['JSONL', 'CSV', 'Markdown'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={zipCompress} onChange={e => setZipCompress(e.target.checked)} /> ZIP 压缩</label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">取消</button>
              <button type="button" onClick={startExport} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">开始导出</button>
            </div>
          </div>
        </div>
      )}
    </KBDetailLayout>
  );
}

function ExportTaskCard({ task, onCancel, onDownload }: { task: ExportTask; onCancel: () => void; onDownload: () => void }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl">📦</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              格式: {task.format} · 范围: {task.scope} · 发起: {task.createdBy} {task.createdAt}
            </div>
            {task.status === 'running' && task.progress != null && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-xs text-gray-500">{task.progress}%</span>
              </div>
            )}
            {task.status === 'completed' && (
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={12} />
                {task.pageCount ? `${task.pageCount.toLocaleString()} 页` : ''}{task.size ? ` · ${task.size}` : ''}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status === 'running' && (
            <>
              <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 进行中</span>
              <button type="button" onClick={onCancel} className="text-xs text-red-600 hover:underline">取消</button>
            </>
          )}
          {task.status === 'completed' && (
            <button type="button" onClick={onDownload} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Download size={12} /> 下载
            </button>
          )}
          {task.status === 'cancelled' && <span className="text-xs text-gray-400">已取消</span>}
        </div>
      </div>
    </div>
  );
}

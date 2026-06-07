import { useState, useMemo } from 'react';
import { Plus, Upload, Search, Trash2, Edit3, Play, X, MessageSquare } from 'lucide-react';
import { EvalSubNav } from '../components/EvalSubNav';
import { EVAL_DATASETS, EVAL_SAMPLES, type EvalDataset, type EvalSample } from '../data/evalMock';
import { mockKBs } from '../mockData';

interface EvalDatasetPageProps {
  onNavigate: (page: string) => void;
}

export function EvalDatasetPage({ onNavigate }: EvalDatasetPageProps) {
  const [datasets, setDatasets] = useState(EVAL_DATASETS);
  const [selectedId, setSelectedId] = useState('ds-001');
  const [query, setQuery] = useState('');
  const [kbFilter, setKbFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newName, setNewName] = useState('');
  const [samples, setSamples] = useState(EVAL_SAMPLES);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = useMemo(() => datasets.filter(d => {
    if (query && !d.name.includes(query)) return false;
    if (kbFilter && d.kbId !== kbFilter) return false;
    return true;
  }), [datasets, query, kbFilter]);

  const selected = datasets.find(d => d.id === selectedId);
  const currentSamples = samples[selectedId] ?? [];

  const handleCreate = () => {
    if (!newName.trim()) { showToast('请输入数据集名称'); return; }
    const ds: EvalDataset = {
      id: `ds-${Date.now()}`,
      name: newName.trim(),
      sampleCount: 0,
      kbId: 'kb-001',
      kbName: mockKBs[0].name,
      tags: [],
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setDatasets(prev => [ds, ...prev]);
    setSamples(prev => ({ ...prev, [ds.id]: [] }));
    setSelectedId(ds.id);
    setShowCreate(false);
    setNewName('');
    showToast('数据集已创建');
  };

  const deleteSample = (sampleId: number) => {
    setSamples(prev => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? []).filter(s => s.id !== sampleId),
    }));
    setDatasets(prev => prev.map(d =>
      d.id === selectedId ? { ...d, sampleCount: Math.max(0, d.sampleCount - 1) } : d
    ));
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-datasets" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">管理评测数据集与黄金样本（US-4.10）</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Upload size={14} /> 导入
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 新建
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索数据集…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" />
        </div>
        <select value={kbFilter} onChange={e => setKbFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
          <option value="">全部知识库</option>
          {mockKBs.slice(0, 5).map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-3 py-2 font-medium">数据集</th>
                <th className="px-3 py-2 font-medium">样本</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ds => (
                <tr
                  key={ds.id}
                  onClick={() => setSelectedId(ds.id)}
                  className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedId === ds.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{ds.name}</p>
                    <p className="text-[10px] text-gray-400">{ds.kbName} · {ds.updatedAt.slice(5)}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{ds.sampleCount}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button type="button" onClick={e => { e.stopPropagation(); showToast('编辑（占位）'); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={12} /></button>
                      <button type="button" onClick={e => { e.stopPropagation(); onNavigate('eval-tasks'); }} className="p-1 text-gray-400 hover:text-green-600"><Play size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selected?.name ?? '—'}</h3>
              <div className="flex gap-1 mt-1">
                {selected?.tags.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => showToast('从对话采样（占位）')} className="text-[10px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MessageSquare size={10} /> 从对话采样
              </button>
              <button type="button" onClick={() => showToast('添加样本（占位）')} className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded-lg flex items-center gap-1">
                <Plus size={10} /> 添加样本
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {currentSamples.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">暂无样本，点击「添加样本」或「导入」</p>
            ) : (
              currentSamples.map(s => (
                <div key={s.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 font-mono">#{s.id}</span>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5">Q: {s.question}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">A: {s.expectedAnswer}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button type="button" className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={11} /></button>
                      <button type="button" onClick={() => deleteSample(s.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={11} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal title="新建评测数据集" onClose={() => setShowCreate(false)}>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">数据集名称</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="合同问答黄金集" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">创建</button>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal title="导入样本" onClose={() => setShowImport(false)}>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center mb-4">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">拖拽 CSV / JSON 文件，或点击选择</p>
            <p className="text-[10px] text-gray-400 mt-1">POST /api/v1/eval/datasets/&#123;id&#125;/import</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={() => { setShowImport(false); showToast('导入成功（mock）'); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">导入</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

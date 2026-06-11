import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Upload, Search, Trash2, Edit3, Play, X, MessageSquare, Loader2 } from 'lucide-react';
import { EvalSubNav } from '../components/EvalSubNav';
import { EVAL_DATASETS, EVAL_SAMPLES, DATASET_TAGS, type EvalDataset, type EvalSample } from '../data/evalMock';
import { mockKBs } from '../mockData';
import { useEvalDatasets, useEvalSamples } from '../hooks/useEvalData';
import { useKnowledgeBaseList } from '../hooks/useKbData';
import { evalService } from '../services/evalService';
import { useApiMode } from '../services/http';

interface EvalDatasetPageProps {
  onNavigate: (page: string) => void;
}

function parseTagsInput(raw: string): string[] {
  return raw.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

function isValidImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || name.endsWith('.json') || file.type.includes('csv') || file.type.includes('json');
}

export function EvalDatasetPage({ onNavigate }: EvalDatasetPageProps) {
  const apiMode = useApiMode();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [kbFilter, setKbFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEditDataset, setShowEditDataset] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddSample, setShowAddSample] = useState(false);
  const [showEditSample, setShowEditSample] = useState(false);
  const [showChatSample, setShowChatSample] = useState(false);
  const [showDeleteDataset, setShowDeleteDataset] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newKbId, setNewKbId] = useState('');
  const [newTags, setNewTags] = useState('');
  const [editSampleId, setEditSampleId] = useState<string | number | null>(null);
  const [samplesLocal, setSamplesLocal] = useState(EVAL_SAMPLES);
  const [datasetsLocal, setDatasetsLocal] = useState(EVAL_DATASETS);
  const [toast, setToast] = useState<string | null>(null);
  const [importDragging, setImportDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const { data: datasets, loading, error, refresh: refreshDatasets } = useEvalDatasets(query, kbFilter, tagFilter);
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = apiMode ? (kbList?.items ?? []) : mockKBs;

  const displayDatasets = useMemo(() => {
    const base = apiMode ? datasets : datasetsLocal;
    return base.map(d => ({
      ...d,
      kbName: kbs.find(k => k.kb_id === d.kbId)?.name || d.kbName || d.kbId,
    }));
  }, [apiMode, datasets, datasetsLocal, kbs]);

  const activeDatasetId = useMemo(() => {
    if (!apiMode) return selectedId || 'ds-001';
    if (!displayDatasets.length) return '';
    if (selectedId && displayDatasets.some(d => d.id === selectedId)) return selectedId;
    return displayDatasets[0]?.id ?? '';
  }, [apiMode, displayDatasets, selectedId]);

  useEffect(() => {
    if (!apiMode) {
      if (!selectedId) setSelectedId('ds-001');
      return;
    }
    if (activeDatasetId && activeDatasetId !== selectedId) {
      setSelectedId(activeDatasetId);
    }
  }, [apiMode, activeDatasetId, selectedId]);

  const { data: apiSamples, refresh: refreshSamples } = useEvalSamples(
    apiMode && activeDatasetId ? activeDatasetId : null,
  );

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = useMemo(() => displayDatasets.filter(d => {
    if (!apiMode && query && !d.name.includes(query)) return false;
    if (!apiMode && kbFilter && d.kbId !== kbFilter) return false;
    if (!apiMode && tagFilter && !d.tags.includes(tagFilter)) return false;
    return true;
  }), [displayDatasets, query, kbFilter, tagFilter, apiMode]);

  const selected = filtered.find(d => d.id === activeDatasetId) ?? filtered[0];
  const currentSamples: EvalSample[] = apiMode
    ? apiSamples
    : (samplesLocal[activeDatasetId] ?? []);

  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
    setNewTags('');
    setNewKbId(kbs[0]?.kb_id || '');
  };

  const openCreate = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const openEditDataset = (ds: EvalDataset) => {
    setNewName(ds.name);
    setNewDescription(ds.description || '');
    setNewKbId(ds.kbId);
    setNewTags(ds.tags.join(', '));
    setShowEditDataset(true);
  };

  const handleAddSample = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) { showToast('请填写问题和期望答案'); return; }
    if (apiMode && activeDatasetId) {
      try {
        await evalService.addSample(activeDatasetId, { question: newQuestion.trim(), expected_answer: newAnswer.trim() });
        refreshSamples();
        refreshDatasets();
      } catch (e) {
        showToast((e as Error).message || '添加失败');
        return;
      }
    } else {
      const existing = samplesLocal[activeDatasetId] ?? [];
      const nextId = Math.max(0, ...existing.map(s => Number(s.id))) + 1;
      const sample: EvalSample = { id: nextId, datasetId: activeDatasetId, question: newQuestion.trim(), expectedAnswer: newAnswer.trim() };
      setSamplesLocal(prev => ({ ...prev, [activeDatasetId]: [...(prev[activeDatasetId] ?? []), sample] }));
      setDatasetsLocal(prev => prev.map(d => d.id === activeDatasetId ? { ...d, sampleCount: d.sampleCount + 1 } : d));
    }
    setNewQuestion('');
    setNewAnswer('');
    setShowAddSample(false);
    showToast('样本已添加');
  };

  const handleUpdateSample = async () => {
    if (!newQuestion.trim()) { showToast('问题不能为空'); return; }
    if (apiMode && activeDatasetId && editSampleId != null) {
      try {
        await evalService.updateSample(activeDatasetId, String(editSampleId), {
          question: newQuestion.trim(),
          expected_answer: newAnswer.trim(),
        });
        refreshSamples();
        setShowEditSample(false);
        showToast('样本已更新');
      } catch (e) {
        showToast((e as Error).message || '更新失败');
      }
      return;
    }
    setSamplesLocal(prev => ({
      ...prev,
      [activeDatasetId]: (prev[activeDatasetId] ?? []).map(s =>
        s.id === editSampleId ? { ...s, question: newQuestion.trim(), expectedAnswer: newAnswer.trim() } : s,
      ),
    }));
    setShowEditSample(false);
    showToast('样本已更新');
  };

  const handleCreate = async () => {
    if (!newName.trim()) { showToast('请输入数据集名称'); return; }
    const kbId = newKbId || kbs[0]?.kb_id || 'kb-001';
    const tags = parseTagsInput(newTags);
    if (apiMode) {
      try {
        const { data } = await evalService.createDataset({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          kb_id: kbId,
          tags,
        });
        setSelectedId(data.id);
        refreshDatasets();
      } catch (e) {
        showToast((e as Error).message || '创建失败');
        return;
      }
    } else {
      const ds: EvalDataset = {
        id: `ds-${Date.now()}`,
        name: newName.trim(),
        sampleCount: 0,
        kbId,
        kbName: kbs.find(k => k.kb_id === kbId)?.name || mockKBs[0].name,
        tags,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setSamplesLocal(prev => ({ ...prev, [ds.id]: [] }));
      setDatasetsLocal(prev => [ds, ...prev]);
      setSelectedId(ds.id);
    }
    setShowCreate(false);
    resetCreateForm();
    showToast('数据集已创建');
  };

  const handleUpdateDataset = async () => {
    if (!newName.trim() || !activeDatasetId) { showToast('请输入数据集名称'); return; }
    const tags = parseTagsInput(newTags);
    if (apiMode) {
      try {
        await evalService.updateDataset(activeDatasetId, {
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          kb_id: newKbId || undefined,
          tags,
        });
        refreshDatasets();
        setShowEditDataset(false);
        showToast('数据集已更新');
      } catch (e) {
        showToast((e as Error).message || '更新失败');
      }
      return;
    }
    setDatasetsLocal(prev => prev.map(d => d.id === activeDatasetId ? {
      ...d,
      name: newName.trim(),
      kbId: newKbId || d.kbId,
      kbName: kbs.find(k => k.kb_id === newKbId)?.name || d.kbName,
      tags,
      updatedAt: new Date().toISOString().slice(0, 10),
    } : d));
    setShowEditDataset(false);
    showToast('数据集已更新');
  };

  const handleDeleteDataset = async () => {
    if (!activeDatasetId) return;
    if (apiMode) {
      try {
        await evalService.deleteDataset(activeDatasetId);
        setSelectedId('');
        refreshDatasets();
        setShowDeleteDataset(false);
        showToast('数据集已删除');
      } catch (e) {
        showToast((e as Error).message || '删除失败');
      }
      return;
    }
    setDatasetsLocal(prev => prev.filter(d => d.id !== activeDatasetId));
    setSelectedId('');
    setShowDeleteDataset(false);
    showToast('数据集已删除');
  };

  const deleteSample = async (sampleId: number | string) => {
    if (apiMode && activeDatasetId) {
      try {
        await evalService.deleteSample(activeDatasetId, String(sampleId));
        refreshSamples();
        refreshDatasets();
      } catch (e) {
        showToast((e as Error).message || '删除失败');
        return;
      }
    } else {
      setSamplesLocal(prev => ({
        ...prev,
        [activeDatasetId]: (prev[activeDatasetId] ?? []).filter(s => s.id !== sampleId),
      }));
      setDatasetsLocal(prev => prev.map(d => d.id === activeDatasetId ? { ...d, sampleCount: Math.max(0, d.sampleCount - 1) } : d));
    }
    showToast('样本已删除');
  };

  const handleImport = async (file: File) => {
    if (!activeDatasetId) {
      showToast('请先选择或创建一个数据集');
      return;
    }
    if (!isValidImportFile(file)) {
      showToast('仅支持 CSV 或 JSON 文件');
      return;
    }
    setImporting(true);
    try {
      if (apiMode) {
        const res = await evalService.importSamples(activeDatasetId, file);
        showToast(`已导入 ${res.imported} 条${res.failed ? `，失败 ${res.failed} 条` : ''}`);
        refreshSamples();
        refreshDatasets();
      } else {
        showToast('演示模式：已模拟导入');
      }
      setShowImport(false);
    } catch (e) {
      showToast((e as Error).message || '导入失败');
    } finally {
      setImporting(false);
      setImportDragging(false);
      if (importFileInputRef.current) importFileInputRef.current.value = '';
    }
  };

  const handleImportFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const file = list.find(isValidImportFile);
    if (!file) {
      showToast('请拖拽 CSV 或 JSON 文件');
      return;
    }
    if (list.length > 1) showToast('已选择第一个有效文件');
    void handleImport(file);
  };

  const handleChatSample = async () => {
    if (!newQuestion.trim()) { showToast('请填写问题'); return; }
    if (apiMode && activeDatasetId) {
      try {
        await evalService.sampleFromChat({
          dataset_id: activeDatasetId,
          question: newQuestion.trim(),
          answer: newAnswer.trim() || undefined,
        });
        refreshSamples();
        refreshDatasets();
      } catch (e) {
        showToast((e as Error).message || '采样失败');
        return;
      }
    } else {
      const existing = samplesLocal[activeDatasetId] ?? [];
      const nextId = Math.max(0, ...existing.map(s => Number(s.id))) + 1;
      setSamplesLocal(prev => ({
        ...prev,
        [activeDatasetId]: [...(prev[activeDatasetId] ?? []), {
          id: nextId,
          datasetId: activeDatasetId,
          question: newQuestion.trim(),
          expectedAnswer: newAnswer.trim(),
        }],
      }));
    }
    setNewQuestion('');
    setNewAnswer('');
    setShowChatSample(false);
    showToast('已从对话采样');
  };

  const openEditSample = (s: EvalSample) => {
    setEditSampleId(s.id);
    setNewQuestion(s.question);
    setNewAnswer(s.expectedAnswer);
    setShowEditSample(true);
  };

  const datasetFormFields = (
    <>
      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">数据集名称</label>
      <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="合同问答黄金集" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3" />
      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">关联知识库</label>
      <select value={newKbId} onChange={e => setNewKbId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3">
        {kbs.length === 0 ? <option value="">暂无知识库</option> : kbs.map(kb => (
          <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>
        ))}
      </select>
      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">描述（可选）</label>
      <input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="用于合同条款问答评测" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3" />
      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">标签（逗号分隔）</label>
      <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="合同, 黄金集" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4" />
    </>
  );

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
          <button
            type="button"
            disabled={apiMode && !activeDatasetId}
            onClick={() => (apiMode && !activeDatasetId ? showToast('请先创建并选择数据集') : setShowImport(true))}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <Upload size={14} /> 导入
          </button>
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 新建
          </button>
        </div>
      </div>

      {apiMode && error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索数据集…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" />
        </div>
        <select value={kbFilter} onChange={e => setKbFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
          <option value="">全部知识库</option>
          {kbs.slice(0, 20).map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          <button type="button" onClick={() => setTagFilter('')} className={`text-[10px] px-2 py-1 rounded-lg border ${!tagFilter ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>全部</button>
          {DATASET_TAGS.map(t => (
            <button key={t} type="button" onClick={() => setTagFilter(tagFilter === t ? '' : t)} className={`text-[10px] px-2 py-1 rounded-lg border ${tagFilter === t ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>{t}</button>
          ))}
        </div>
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
              {loading && apiMode && filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-8 text-center text-xs text-gray-400">加载中…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-8 text-center text-xs text-gray-400">暂无数据集，点击「新建」</td></tr>
              ) : filtered.map(ds => (
                <tr
                  key={ds.id}
                  onClick={() => setSelectedId(ds.id)}
                  className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${activeDatasetId === ds.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{ds.name}</p>
                    <p className="text-[10px] text-gray-400">{ds.kbName} · {ds.updatedAt.slice(5)}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{ds.sampleCount}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button type="button" title="编辑" onClick={e => { e.stopPropagation(); setSelectedId(ds.id); openEditDataset(ds); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={12} /></button>
                      <button type="button" title="创建评测任务" onClick={e => { e.stopPropagation(); onNavigate('eval-tasks'); }} className="p-1 text-gray-400 hover:text-green-600"><Play size={12} /></button>
                      <button type="button" title="删除" onClick={e => { e.stopPropagation(); setSelectedId(ds.id); setShowDeleteDataset(true); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
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
              <div className="flex gap-1 mt-1 flex-wrap">
                {selected?.tags.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={!activeDatasetId} onClick={() => { setNewQuestion(''); setNewAnswer(''); setShowChatSample(true); }} className="text-[10px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-1 text-gray-600 dark:text-gray-400 disabled:opacity-50">
                <MessageSquare size={10} /> 从对话采样
              </button>
              <button type="button" disabled={!activeDatasetId} onClick={() => { setNewQuestion(''); setNewAnswer(''); setShowAddSample(true); }} className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded-lg flex items-center gap-1 disabled:opacity-50">
                <Plus size={10} /> 添加样本
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!activeDatasetId ? (
              <p className="text-xs text-gray-400 text-center py-8">请选择左侧数据集</p>
            ) : currentSamples.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">暂无样本，点击「添加样本」或「导入」</p>
            ) : (
              currentSamples.map(s => (
                <div key={s.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 font-mono">#{String(s.id).slice(0, 8)}</span>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5">Q: {s.question}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">A: {s.expectedAnswer || '—'}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button type="button" onClick={() => openEditSample(s)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={11} /></button>
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
          {datasetFormFields}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">创建</button>
          </div>
        </Modal>
      )}

      {showEditDataset && (
        <Modal title="编辑评测数据集" onClose={() => setShowEditDataset(false)}>
          {datasetFormFields}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowEditDataset(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleUpdateDataset} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">保存</button>
          </div>
        </Modal>
      )}

      {showDeleteDataset && (
        <Modal title="删除数据集" onClose={() => setShowDeleteDataset(false)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">确定删除「{selected?.name}」？关联样本将保留在数据库中但数据集不可再用于评测。</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowDeleteDataset(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleDeleteDataset} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">删除</button>
          </div>
        </Modal>
      )}

      {showAddSample && (
        <Modal title="添加样本" onClose={() => setShowAddSample(false)}>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">问题</label>
          <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="用户可能提出的问题" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3" />
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">期望答案</label>
          <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} rows={3} placeholder="黄金标准答案" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddSample(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleAddSample} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
          </div>
        </Modal>
      )}

      {showEditSample && (
        <Modal title="编辑样本" onClose={() => setShowEditSample(false)}>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">问题</label>
          <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3" />
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">期望答案</label>
          <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowEditSample(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleUpdateSample} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">保存</button>
          </div>
        </Modal>
      )}

      {showChatSample && (
        <Modal title="从对话采样" onClose={() => setShowChatSample(false)}>
          <p className="text-xs text-gray-500 mb-3">将对话中的问答对加入当前数据集作为黄金样本。</p>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">问题</label>
          <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-3" />
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">期望答案（可选）</label>
          <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowChatSample(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
            <button type="button" onClick={handleChatSample} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">加入数据集</button>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal title="导入样本" onClose={() => { if (!importing) setShowImport(false); }}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">导入到：<strong>{selected?.name}</strong></p>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' && !importing) importFileInputRef.current?.click(); }}
            onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setImportDragging(true); }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setImportDragging(true); }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setImportDragging(false); }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              setImportDragging(false);
              if (importing) return;
              if (e.dataTransfer.files.length) handleImportFiles(e.dataTransfer.files);
            }}
            onClick={() => { if (!importing) importFileInputRef.current?.click(); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-colors ${
              importing
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-wait'
                : importDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-copy'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
            }`}
          >
            {importing ? (
              <Loader2 size={28} className="mx-auto text-blue-500 mb-2 animate-spin" />
            ) : (
              <Upload size={28} className={`mx-auto mb-2 ${importDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {importing ? '正在导入…' : importDragging ? '松开鼠标即可上传' : '拖拽 CSV / JSON 至此处，或点击选择文件'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">CSV 表头：question, expected_answer</p>
          </div>
          <input
            ref={importFileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
            }}
          />
          <div className="flex justify-end gap-2">
            <button type="button" disabled={importing} onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">取消</button>
            <button
              type="button"
              disabled={importing}
              onClick={() => importFileInputRef.current?.click()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              选择文件
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

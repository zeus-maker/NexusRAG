import { useState, useEffect } from 'react';
import {
  HardDrive, Database, Save, Play, RotateCcw,
  CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, Lock,
} from 'lucide-react';
import { TableCard } from '../components/SystemSubNav';
import {
  PROMPT_TEMPLATES, GRAY_RELEASES, BACKUP_POLICY, BACKUP_RECORDS,
  VECTOR_DB_OPTIONS, VECTOR_MIGRATION_PREVIEW,
  type PromptTemplate, type GrayRelease,
} from '../data/systemOpsMock';
import {
  useBackupPolicy, useGrayReleases, usePromptTemplates, useVectorDbConfig, systemService,
} from '../hooks/useSystemData';
import { useApiMode } from '../services/http';

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
    </div>
  );
}

/* ── §6.5 Prompt 模板 ── */

export function PromptTemplatesPage() {
  const apiMode = useApiMode();
  const { data: apiTemplates, refresh } = usePromptTemplates();
  const [templates, setTemplates] = useState(PROMPT_TEMPLATES);
  const [selected, setSelected] = useState<PromptTemplate>(templates[0]);
  const [body, setBody] = useState(selected.body);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (apiMode && apiTemplates.length) {
      setTemplates(apiTemplates);
      setSelected(apiTemplates[0]);
      setBody(apiTemplates[0].body);
    }
  }, [apiMode, apiTemplates]);

  const select = (t: PromptTemplate) => { setSelected(t); setBody(t.body); };

  const handlePublish = async () => {
    if (apiMode) {
      try {
        const next = templates.map(t => t.id === selected.id ? { ...t, body, status: 'published' as const } : t);
        await systemService.putPromptTemplates(next);
        setTemplates(next);
        refresh();
        showToast('模板已发布');
      } catch (e) {
        showToast((e as Error).message || '发布失败');
      }
      return;
    }
    showToast('模板已发布');
  };

  const handleTest = async () => {
    if (apiMode) {
      try {
        const { data } = await systemService.testPromptTemplate(selected.id, { body, variables: { context: '...', query: '测试' } });
        showToast(data.valid ? '预览：语法校验通过' : '预览失败');
      } catch (e) {
        showToast((e as Error).message || '测试失败');
      }
      return;
    }
    showToast('预览：语法校验通过（mock）');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Prompt 模板管理" desc="§6.5 · 场景绑定 · 版本发布 · 变量 {{var}} 语法校验" />
        <div className="flex gap-2">
          <button type="button" onClick={() => showToast('A/B 测试已创建（mock）')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Play size={14} /> A/B 测试
          </button>
          <button type="button" onClick={handlePublish} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={14} /> 发布
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="lg:w-80 flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">模板列表</div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {templates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.id === t.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{t.scene} · {t.version} · {t.uses.toLocaleString()} 次</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${t.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>场景: <strong className="text-gray-700 dark:text-gray-300">{selected.scene}</strong></span>
            <span>版本: {selected.version}</span>
            <span>变量: {'{{context}}'}, {'{{query}}'}</span>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="flex-1 min-h-[280px] font-mono text-xs p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={handleTest} className="self-start text-xs text-blue-600 hover:underline">测试预览</button>
        </div>
      </div>
    </div>
  );
}

/* ── §6.6 灰度发布 ── */

export function GrayReleasePage() {
  const apiMode = useApiMode();
  const { data: apiReleases, refresh } = useGrayReleases();
  const [releases, setReleases] = useState(GRAY_RELEASES);
  const [selected, setSelected] = useState<GrayRelease>(releases[0]);
  const [traffic, setTraffic] = useState(selected.trafficPct);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (apiMode && apiReleases.length) {
      setReleases(apiReleases);
      setSelected(apiReleases[0]);
      setTraffic(apiReleases[0].trafficPct);
    }
  }, [apiMode, apiReleases]);

  const updateTraffic = (pct: number) => {
    setTraffic(pct);
    setReleases(prev => prev.map(r => r.id === selected.id ? { ...r, trafficPct: pct } : r));
    setSelected(s => ({ ...s, trafficPct: pct }));
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <PageHeader title="灰度发布" desc="§6.6 · 流量比例 · 灰度 vs 基线指标 · 扩量 / 全量 / 回滚" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">发布列表</div>
          {releases.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setSelected(r); setTraffic(r.trafficPct); }}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.id === r.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
            >
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.name}</div>
              <div className="text-[10px] text-gray-500">{r.target} · {r.trafficPct}% · {r.status}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">{selected.name}</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs text-gray-500 w-16">流量</span>
              <input type="range" min={0} max={100} value={traffic} onChange={e => updateTraffic(Number(e.target.value))} className="flex-1" />
              <span className="text-sm font-bold text-purple-600 w-10">{traffic}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-gray-500 mb-1">基线 Faithfulness</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{(selected.baselineFaith * 100).toFixed(0)}%</div>
                <div className="text-gray-500 mt-2">P95 {(selected.baselineLatency).toFixed(1)}s</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="text-purple-600 mb-1">灰度 Faithfulness</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{(selected.grayFaith * 100).toFixed(0)}%</div>
                <div className="text-purple-600 mt-2">P95 {(selected.grayLatency).toFixed(1)}s</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => updateTraffic(Math.min(100, traffic + 25))} className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg">扩量 +25%</button>
              <button type="button" onClick={async () => {
                if (apiMode) {
                  try {
                    const { data } = await systemService.publishGrayRelease(selected.id);
                    showToast(`全量发布任务 ${data.job.status}`);
                    refresh();
                  } catch (e) { showToast((e as Error).message || '失败'); }
                  return;
                }
                showToast('已全量发布（mock）');
              }} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg">全量</button>
              <button type="button" onClick={async () => {
                if (apiMode) {
                  try {
                    const { data } = await systemService.rollbackGrayRelease(selected.id);
                    showToast(`回滚任务 ${data.job.status}`);
                    refresh();
                  } catch (e) { showToast((e as Error).message || '失败'); }
                  return;
                }
                showToast('已回滚至基线（mock）');
              }} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg flex items-center gap-1"><RotateCcw size={12} /> 回滚</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── §6.7 备份恢复 ── */

export function BackupPage() {
  const apiMode = useApiMode();
  const { data: apiPolicy, refresh: refreshPolicy } = useBackupPolicy();
  const [policy, setPolicy] = useState(BACKUP_POLICY);
  const [backupJobs, setBackupJobs] = useState(BACKUP_RECORDS);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreStep, setRestoreStep] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (apiMode && apiPolicy) setPolicy(apiPolicy);
  }, [apiMode, apiPolicy]);

  useEffect(() => {
    if (!apiMode) return;
    systemService.listBackups().then(({ data }) => {
      if (data.items?.length) {
        setBackupJobs(data.items.map(j => ({
          id: j.id,
          type: 'full' as const,
          size: '—',
          status: j.status === 'completed' ? 'completed' as const : j.status === 'running' ? 'running' as const : 'failed' as const,
          created: j.created_at ? new Date(j.created_at).toLocaleString() : '',
          retention: `${policy.retentionDays} 天`,
        })));
      }
    }).catch(() => {});
  }, [apiMode, policy.retentionDays]);

  const [restoreBackupId, setRestoreBackupId] = useState<string | null>(null);

  const savePolicy = async () => {
    if (apiMode) {
      try {
        await systemService.putBackupPolicy(policy);
        refreshPolicy();
        showToast('备份策略已保存');
      } catch (e) {
        showToast((e as Error).message || '保存失败');
      }
      return;
    }
    showToast('备份策略已保存（mock）');
  };

  const confirmRestore = async () => {
    if (apiMode) {
      try {
        const { data } = await systemService.triggerRestore({ backup_id: restoreBackupId || 'latest' });
        setShowRestore(false);
        showToast(`恢复任务 ${data.job.status} (${data.job.progress ?? 0}%)`);
      } catch (e) {
        showToast((e as Error).message || '恢复失败');
      }
      return;
    }
    setShowRestore(false);
    showToast('恢复任务已提交（mock）');
  };

  const triggerBackup = async () => {
    if (apiMode) {
      try {
        const { data } = await systemService.triggerBackup();
        showToast(`备份任务 ${data.job.status} (${data.job.progress}%)`);
        refreshPolicy();
      } catch (e) {
        showToast((e as Error).message || '触发失败');
      }
      return;
    }
    showToast('立即备份已触发（mock）');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="备份与恢复" desc="§6.7 · 自动策略 · AES-256 · 恢复三步向导" />
        <button type="button" onClick={savePolicy} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
          <Save size={14} /> 保存策略
        </button>
        <button type="button" onClick={triggerBackup} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
          <HardDrive size={14} /> 立即备份
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={policy.enabled} onChange={e => setPolicy(p => ({ ...p, enabled: e.target.checked }))} />
          启用自动备份
        </label>
        <div><span className="text-gray-500 text-xs">计划</span><div className="font-medium">{policy.schedule}</div></div>
        <div><span className="text-gray-500 text-xs">保留</span><div className="font-medium">{policy.retentionDays} 天</div></div>
        <div className="flex items-center gap-1 text-green-600 text-xs"><Lock size={12} /> AES-256 {policy.encrypt ? '已启用' : '未启用'}</div>
      </div>

      <TableCard>
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">备份记录</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">类型</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">大小</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">状态</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">时间</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {backupJobs.map(r => (
              <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3">{r.type === 'full' ? '全量' : '增量'}</td>
                <td className="px-4 py-3">{r.size}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.created}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => { setRestoreBackupId(r.id); setShowRestore(true); setRestoreStep(0); setConfirmText(''); }} className="text-xs text-blue-600 hover:underline">恢复</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {showRestore && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">恢复向导 · 步骤 {restoreStep + 1}/3</h3>
            {restoreStep === 0 && <p className="text-sm text-gray-600 dark:text-gray-400">选择备份点 <strong>{restoreBackupId || 'bk-1'}</strong> 进行恢复。</p>}
            {restoreStep === 1 && <p className="text-sm text-gray-600 dark:text-gray-400">完整性校验通过 · 预计耗时 45 分钟 · 恢复期间服务只读。</p>}
            {restoreStep === 2 && (
              <div>
                <p className="text-sm text-red-600 mb-2">输入 <strong>RESTORE</strong> 确认恢复操作</p>
                <input value={confirmText} onChange={e => setConfirmText(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="RESTORE" />
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button type="button" onClick={() => setShowRestore(false)} className="text-sm text-gray-500">取消</button>
              <div className="flex gap-2">
                {restoreStep > 0 && <button type="button" onClick={() => setRestoreStep(s => s - 1)} className="text-sm px-3 py-1.5 border rounded-lg flex items-center gap-1"><ChevronLeft size={14} /> 上一步</button>}
                {restoreStep < 2 ? (
                  <button type="button" onClick={() => setRestoreStep(s => s + 1)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1">下一步 <ChevronRight size={14} /></button>
                ) : (
                  <button type="button" disabled={confirmText !== 'RESTORE'} onClick={confirmRestore} className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg disabled:opacity-40">确认恢复</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── §6.8 向量库切换 ── */

const MIGRATION_STEPS = ['选择目标', '映射配置', '迁移预览', '执行切换'];

export function VectorDbSwitchPage() {
  const apiMode = useApiMode();
  const { data: vectorCfg } = useVectorDbConfig();
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const vectorOptions = apiMode && Array.isArray((vectorCfg as { options?: typeof VECTOR_DB_OPTIONS }).options)
    ? (vectorCfg as { options: typeof VECTOR_DB_OPTIONS }).options
    : VECTOR_DB_OPTIONS;

  const runMigrate = async () => {
    if (apiMode && target) {
      try {
        await systemService.putVectorDb({ ...(vectorCfg as object), target });
        const { data } = await systemService.migrateVectorDb({ target });
        showToast(`迁移任务 ${data.job.status}`);
      } catch (e) {
        showToast((e as Error).message || '迁移失败');
      }
      return;
    }
    showToast('迁移任务已提交（mock）');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <PageHeader title="向量库切换" desc="§6.8 · Milvus / Qdrant / ES / Weaviate / pgvector · 7 天双写宽限期" />

      <div className="flex gap-2">
        {MIGRATION_STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
            {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vectorOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => !opt.current && setTarget(opt.id)}
              disabled={opt.current}
              className={`p-4 rounded-xl border text-left transition-colors ${
                opt.current ? 'border-green-200 bg-green-50/50 opacity-70 cursor-default' :
                target === opt.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Database size={20} className={opt.current ? 'text-green-600' : 'text-gray-400'} />
              <div className="text-sm font-semibold mt-2 text-gray-800 dark:text-gray-200">{opt.label}</div>
              <div className="text-[10px] text-gray-500 mt-1">{opt.status}{opt.current ? ' · 当前' : ''}</div>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-400">集合映射：12 个 collection → 目标库同名索引</p>
          <p className="text-gray-600 dark:text-gray-400">凭证：环境变量加密存储 · 连接测试 <span className="text-green-600">通过</span></p>
          <p className="text-gray-600 dark:text-gray-400">双写宽限期：7 天（切换后新旧库并行写入）</p>
        </div>
      )}

      {step === 2 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { l: '集合数', v: String(VECTOR_MIGRATION_PREVIEW.collections) },
            { l: '向量条数', v: VECTOR_MIGRATION_PREVIEW.vectors },
            { l: '预计耗时', v: `${VECTOR_MIGRATION_PREVIEW.estimatedHours}h` },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.v}</div>
              <div className="text-xs text-gray-500">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            确认切换至 <strong>{VECTOR_DB_OPTIONS.find(o => o.id === target)?.label}</strong>？迁移期间检索可能短暂降级，建议在低峰执行。
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep(s => s - 1)} className="text-sm px-4 py-2 border rounded-lg disabled:opacity-40">上一步</button>
        {step < 3 ? (
          <button type="button" disabled={step === 0 && !target} onClick={() => setStep(s => s + 1)} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-40">下一步</button>
        ) : (
          <button type="button" onClick={runMigrate} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg">执行切换</button>
        )}
      </div>
    </div>
  );
}

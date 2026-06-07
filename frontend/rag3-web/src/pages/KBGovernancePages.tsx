import { useState } from 'react';
import { AlertTriangle, ScrollText, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { KBDetailLayout } from '../components/KBDetailLayout';
import {
  getStaleDocuments,
  getProcessingLogs,
  FRESHNESS_TIER_LABELS,
  CERT_LABELS,
  type FreshnessTier,
} from '../data/kbGovernanceMock';
import { useRealApi } from '../services/http';
import { useIngestionLogs } from '../hooks/useKbData';

interface Props {
  kbId: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function KBStaleGovernancePage({ kbId, onNavigate }: Props) {
  const [tierFilter, setTierFilter] = useState<FreshnessTier | 'all'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  if (useRealApi) {
    return (
      <KBDetailLayout kbId={kbId} activeKey="kb-detail" onNavigate={onNavigate}>
        <div className="p-6 text-sm text-gray-600">
          陈旧文档治理为 RAG3 原型能力，尚无对应 RAGFlow API。请使用「文档管理」查看解析状态，或关闭 API 模式体验 mock 治理流程。
        </div>
      </KBDetailLayout>
    );
  }

  const docs = getStaleDocuments(kbId).filter(d => tierFilter === 'all' || d.tier === tierFilter);

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-detail" onNavigate={onNavigate}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" /> 陈旧文档治理
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">US-1.13 · 新鲜度分级与认证队列</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => showToast('已批量标记待认证（mock）')} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              批量认证
            </button>
            <button type="button" onClick={() => showToast('已对相关文档启用检索降权（mock）')} className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              批量降权
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'realtime', 'daily', 'weekly', 'monthly'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 text-xs rounded-lg border ${tierFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {t === 'all' ? '全部' : FRESHNESS_TIER_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">文档</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">新鲜度</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">源更新</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">认证</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const cert = CERT_LABELS[d.certification_status];
                return (
                  <tr key={d.doc_id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{d.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{FRESHNESS_TIER_LABELS[d.tier]}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.source_updated}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cert.color}`}>{cert.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => showToast(`已认证 ${d.name}（mock）`)} className="text-xs text-blue-600 hover:underline">认证</button>
                        <button type="button" onClick={() => showToast(`已降权 ${d.name}（mock）`)} className="text-xs text-amber-600 hover:underline">降权</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </KBDetailLayout>
  );
}

export function KBProcessingLogsPage({ kbId, onNavigate }: Props) {
  const { data: apiLogs, loading, error, refresh } = useIngestionLogs(kbId);
  const logs = useRealApi ? apiLogs.items : getProcessingLogs(kbId);

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-logs" onNavigate={onNavigate}>
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ScrollText size={18} className="text-blue-600" /> 处理日志
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{useRealApi ? 'RAGFlow GET /datasets/:id/ingestions' : '入库 / 同步 / 索引 / ACL 审计（§10.10.2）'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => refresh()} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw size={14} /> 刷新{loading ? '…' : ''}
            </button>
            <button type="button" className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={14} /> 导出 CSV
            </button>
          </div>
        </div>

        {error && useRealApi && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {useRealApi ? (
                  <>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">时间</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">文档</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">状态</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">进度</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">消息</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">时间</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">级别</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">类型</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">source_id</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">chunk_ids</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">acl_ver</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">摘要</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {useRealApi ? logs.map((log: { id: string; time: string; name: string; status: string; statusColor: string; progress: number; message: string }) => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{log.time}</td>
                  <td className="px-3 py-2 text-gray-700">{log.name}</td>
                  <td className="px-3 py-2"><span className={`font-medium ${log.statusColor}`}>{log.status}</span></td>
                  <td className="px-3 py-2 text-gray-600">{log.progress}%</td>
                  <td className="px-3 py-2 text-gray-700">{log.message}</td>
                </tr>
              )) : logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{log.time}</td>
                  <td className="px-3 py-2">
                    <span className={`font-medium ${log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARN' ? 'text-amber-600' : 'text-gray-600'}`}>{log.level}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{log.type}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono">{log.source_record_id ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono">{log.chunk_ids ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono">{log.acl_version ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-gray-400 flex items-center gap-1">
          <ShieldCheck size={12} /> {useRealApi ? '数据来自 RAGFlow 摄取日志 API' : '导出 CSV 含 policy_version、sync_timestamp（mock）'}
        </p>
      </div>
    </KBDetailLayout>
  );
}

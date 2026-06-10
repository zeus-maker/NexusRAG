import { useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { mockKBs } from '../mockData';
import { useRealApi } from '../services/http';
import { useKnowledgeBaseList } from '../hooks/useKbData';
import { PROMPT_TEMPLATES } from '../data/chatMock';

export interface ChatSettings {
  convTitle: string;
  kbIds: string[];
  systemPrompt: string;
  opener: string;
  similarityThreshold: number;
  vectorWeight: number;
  topK: number;
  rerankEnabled: boolean;
  rerankModel: string;
  channelGraph: boolean;
  channelWiki: boolean;
  channelPageIndex: boolean;
  temperature: number;
  maxTokens: number;
  llmModel: string;
  showCitations: boolean;
  showTrace: boolean;
  streaming: boolean;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  convTitle: '新对话',
  kbIds: ['kb-001'],
  systemPrompt: PROMPT_TEMPLATES[0].prompt,
  opener: '您好，我可以帮您查询合同条款与合规政策，请直接提问。',
  similarityThreshold: 0.2,
  vectorWeight: 0.7,
  topK: 10,
  rerankEnabled: true,
  rerankModel: 'bge-reranker-v2-m3',
  channelGraph: false,
  channelWiki: true,
  channelPageIndex: true,
  temperature: 0.3,
  maxTokens: 2048,
  llmModel: 'DeepSeek-v4',
  showCitations: true,
  showTrace: true,
  streaming: true,
};

interface ChatSettingsPanelProps {
  open: boolean;
  settings: ChatSettings;
  onChange: (s: ChatSettings) => void;
  onClose: () => void;
  onSave: () => void;
}

export function ChatSettingsPanel({ open, settings, onChange, onClose, onSave }: ChatSettingsPanelProps) {
  const [saved, setSaved] = useState(false);
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbOptions = useRealApi && kbList?.items?.length
    ? kbList.items.map(kb => ({ kb_id: kb.kb_id, name: kb.name, icon: kb.icon || '📚' }))
    : mockKBs.map(kb => ({ kb_id: kb.kb_id, name: kb.name, icon: kb.icon }));
  if (!open) return null;

  const patch = (p: Partial<ChatSettings>) => onChange({ ...settings, ...p });

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">对话设置</h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">基础设置</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">对话名称</label>
              <input value={settings.convTitle} onChange={e => patch({ convTitle: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">关联知识库</label>
              <div className="space-y-1 max-h-28 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg p-2">
                {kbOptions.map(kb => (
                  <label key={kb.kb_id} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={settings.kbIds.includes(kb.kb_id)}
                      onChange={e => patch({
                        kbIds: e.target.checked
                          ? [...settings.kbIds, kb.kb_id]
                          : settings.kbIds.filter(id => id !== kb.kb_id),
                      })}
                      className="rounded"
                    />
                    <span>{kb.icon}</span>
                    <span className="truncate text-gray-700 dark:text-gray-300">{kb.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">系统提示词</label>
                <select
                  className="text-[10px] border border-gray-200 dark:border-gray-600 rounded px-1 dark:bg-gray-800"
                  onChange={e => {
                    const t = PROMPT_TEMPLATES.find(p => p.id === e.target.value);
                    if (t) patch({ systemPrompt: t.prompt });
                  }}
                >
                  <option value="">模板</option>
                  {PROMPT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <textarea value={settings.systemPrompt} onChange={e => patch({ systemPrompt: e.target.value })} rows={3} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">开场白</label>
              <input value={settings.opener} onChange={e => patch({ opener: e.target.value })} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">检索参数</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>相似度阈值</span><span>{settings.similarityThreshold}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={settings.similarityThreshold} onChange={e => patch({ similarityThreshold: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>向量权重</span><span>{settings.vectorWeight}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={settings.vectorWeight} onChange={e => patch({ vectorWeight: Number(e.target.value) })} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Top-K</label>
                <input type="number" min={1} max={50} value={settings.topK} onChange={e => patch({ topK: Number(e.target.value) })} className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Rerank 模型</label>
                <select value={settings.rerankModel} onChange={e => patch({ rerankModel: e.target.value })} disabled={!settings.rerankEnabled} className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50">
                  <option>bge-reranker-v2-m3</option><option>bce-ranker</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={settings.rerankEnabled} onChange={e => patch({ rerankEnabled: e.target.checked })} className="rounded" /> 启用 Rerank
            </label>
            <div className="space-y-1.5">
              {[
                { key: 'channelPageIndex' as const, label: 'PageIndex 通道' },
                { key: 'channelGraph' as const, label: '知识图谱增强' },
                { key: 'channelWiki' as const, label: 'Wiki 通道' },
              ].map(ch => (
                <label key={ch.key} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings[ch.key]} onChange={e => patch({ [ch.key]: e.target.checked })} className="rounded" /> {ch.label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">元数据过滤</span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">department=法务</span>
              <button type="button" className="text-blue-600 hover:underline">+ 添加</button>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">高级选项</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">温度</label>
                <input type="number" min={0} max={2} step={0.1} value={settings.temperature} onChange={e => patch({ temperature: Number(e.target.value) })} className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Max Tokens</label>
                <input type="number" value={settings.maxTokens} onChange={e => patch({ maxTokens: Number(e.target.value) })} className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">LLM 模型</label>
              <select value={settings.llmModel} onChange={e => patch({ llmModel: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                <option>DeepSeek-v4</option><option>Qwen3-72B</option><option>Claude-4</option>
              </select>
            </div>
            <div className="space-y-1.5">
              {[
                { key: 'showCitations' as const, label: '显示引用来源' },
                { key: 'showTrace' as const, label: '显示查询 Trace' },
                { key: 'streaming' as const, label: '流式输出' },
              ].map(o => (
                <label key={o.key} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings[o.key]} onChange={e => patch({ [o.key]: e.target.checked })} className="rounded" /> {o.label}
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
        <button type="button" onClick={() => onChange(DEFAULT_CHAT_SETTINGS)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <RotateCcw size={12} /> 重置
        </button>
        <button type="button" onClick={handleSave} className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg text-white ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
          <Save size={12} /> {saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  );
}

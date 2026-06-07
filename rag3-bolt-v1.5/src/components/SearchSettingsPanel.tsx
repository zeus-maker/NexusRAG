import { useState } from 'react';
import { X, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { mockKBs } from '../mockData';

export interface MetadataFilter {
  id: string;
  field: string;
  operator: 'eq' | 'neq' | 'contains';
  value: string;
}

export interface SearchSettings {
  kbIds: string[];
  similarityThreshold: number;
  topK: number;
  vectorWeight: number;
  rerankEnabled: boolean;
  graphEnabled: boolean;
  highlightKeywords: boolean;
  webSearch: boolean;
  aiSummary: boolean;
  relatedSearch: boolean;
  mindmap: boolean;
  metadataFilters: MetadataFilter[];
  crossLanguages: string[];
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  kbIds: ['kb-001'],
  similarityThreshold: 0.2,
  topK: 10,
  vectorWeight: 0.7,
  rerankEnabled: true,
  graphEnabled: true,
  highlightKeywords: true,
  webSearch: false,
  aiSummary: true,
  relatedSearch: true,
  mindmap: true,
  metadataFilters: [],
  crossLanguages: ['zh', 'en'],
};

const FILTER_FIELDS = ['department', 'doc_type', 'author', 'year'];
const OPERATORS: { value: MetadataFilter['operator']; label: string }[] = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'contains', label: '包含' },
];

interface SearchSettingsPanelProps {
  open: boolean;
  settings: SearchSettings;
  onChange: (s: SearchSettings) => void;
  onClose: () => void;
  onSave: () => void;
}

export function SearchSettingsPanel({ open, settings, onChange, onClose, onSave }: SearchSettingsPanelProps) {
  const [saved, setSaved] = useState(false);
  if (!open) return null;

  const patch = (p: Partial<SearchSettings>) => onChange({ ...settings, ...p });

  const toggleKb = (kbId: string) => {
    const next = settings.kbIds.includes(kbId)
      ? settings.kbIds.filter(id => id !== kbId)
      : [...settings.kbIds, kbId];
    patch({ kbIds: next.length ? next : [kbId] });
  };

  const toggleLang = (lang: string) => {
    const next = settings.crossLanguages.includes(lang)
      ? settings.crossLanguages.filter(l => l !== lang)
      : [...settings.crossLanguages, lang];
    patch({ crossLanguages: next.length ? next : ['zh'] });
  };

  const addFilter = () => {
    patch({
      metadataFilters: [
        ...settings.metadataFilters,
        { id: `mf-${Date.now()}`, field: 'department', operator: 'eq', value: '' },
      ],
    });
  };

  const updateFilter = (id: string, p: Partial<MetadataFilter>) => {
    patch({
      metadataFilters: settings.metadataFilters.map(f => (f.id === id ? { ...f, ...p } : f)),
    });
  };

  const removeFilter = (id: string) => {
    patch({ metadataFilters: settings.metadataFilters.filter(f => f.id !== id) });
  };

  const handleReset = () => onChange({ ...DEFAULT_SEARCH_SETTINGS, kbIds: settings.kbIds });

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">搜索应用设置</h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">关联知识库</label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {mockKBs.slice(0, 6).map(kb => (
              <label key={kb.kb_id} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={settings.kbIds.includes(kb.kb_id)}
                  onChange={() => toggleKb(kb.kb_id)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{kb.icon} {kb.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">相似度阈值</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={settings.similarityThreshold}
              onChange={e => patch({ similarityThreshold: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Top-K</label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.topK}
              onChange={e => patch({ topK: parseInt(e.target.value) || 10 })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">向量权重</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={settings.vectorWeight}
              onChange={e => patch({ vectorWeight: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <div className="space-y-2">
          {[
            { key: 'rerankEnabled' as const, label: 'Rerank 精排' },
            { key: 'graphEnabled' as const, label: '知识图谱' },
            { key: 'highlightKeywords' as const, label: '高亮关键词' },
            { key: 'webSearch' as const, label: 'Web 搜索（Tavily）' },
            { key: 'aiSummary' as const, label: 'AI 摘要' },
            { key: 'relatedSearch' as const, label: '相关搜索' },
            { key: 'mindmap' as const, label: 'Mindmap 思维导图' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings[opt.key]}
                onChange={e => patch({ [opt.key]: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">元数据过滤</label>
            <button type="button" onClick={addFilter} className="text-[10px] text-blue-600 flex items-center gap-0.5 hover:underline">
              <Plus size={10} /> 添加 AND
            </button>
          </div>
          {settings.metadataFilters.length === 0 ? (
            <p className="text-[10px] text-gray-400 italic">暂无过滤条件</p>
          ) : (
            <div className="space-y-2">
              {settings.metadataFilters.map(f => (
                <div key={f.id} className="flex gap-1 items-center">
                  <select
                    value={f.field}
                    onChange={e => updateFilter(f.id, { field: e.target.value })}
                    className="flex-1 px-1.5 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    {FILTER_FIELDS.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <select
                    value={f.operator}
                    onChange={e => updateFilter(f.id, { operator: e.target.value as MetadataFilter['operator'] })}
                    className="w-14 px-1 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  <input
                    value={f.value}
                    onChange={e => updateFilter(f.id, { value: e.target.value })}
                    placeholder="值"
                    className="flex-1 px-1.5 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                  <button type="button" onClick={() => removeFilter(f.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">跨语言</label>
          <div className="flex gap-3">
            {[
              { code: 'zh', label: '中文' },
              { code: 'en', label: 'English' },
              { code: 'ja', label: '日本語' },
            ].map(lang => (
              <label key={lang.code} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.crossLanguages.includes(lang.code)}
                  onChange={() => toggleLang(lang.code)}
                  className="rounded text-blue-600"
                />
                <span className="text-[10px] text-gray-600 dark:text-gray-400">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
        <button type="button" onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <RotateCcw size={11} /> 重置
        </button>
        <button type="button" onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save size={11} /> {saved ? '已保存' : '保存'}
        </button>
      </div>
    </div>
  );
}

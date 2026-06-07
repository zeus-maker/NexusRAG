import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Loader, CheckCircle, Sparkles,
  Scale, BarChart2, FlaskConical, BookOpen, X
} from 'lucide-react';

export interface KBCreateForm {
  name: string;
  description: string;
  icon: string;
  language: string;
  chunkStrategy: string;
  embeddingModel: string;
  llmModel: string;
  rerankerModel: string;
  visibility: 'me' | 'team';
  enableGraphRAG: boolean;
  enablePageIndex: boolean;
}

const DEFAULT_FORM: KBCreateForm = {
  name: '',
  description: '',
  icon: '📚',
  language: '中文',
  chunkStrategy: '通用分块',
  embeddingModel: 'BAAI/bge-m3',
  llmModel: 'DeepSeek-v4',
  rerankerModel: 'bge-reranker-v2-m3',
  visibility: 'team',
  enableGraphRAG: false,
  enablePageIndex: true,
};

const ICON_OPTIONS = ['📚', '⚖️', '📊', '🔬', '📋', '📖', '🏗️', '💼', '🔒', '🌐'];

const TEMPLATES = [
  { id: 'legal', label: '法务合同', icon: Scale, emoji: '⚖️', desc: '合同模板、法规条文', chunk: 'Laws（法律）', graph: true },
  { id: 'finance', label: '财务报告', icon: BarChart2, emoji: '📊', desc: '财报、审计文档', chunk: '表格优先', graph: false },
  { id: 'rd', label: '研发文档', icon: FlaskConical, emoji: '🔬', desc: 'API、架构设计', chunk: '代码感知', graph: false },
  { id: 'general', label: '通用知识', icon: BookOpen, emoji: '📚', desc: '手册、政策、FAQ', chunk: '通用分块', graph: false },
];

const STEPS = ['基础信息', '解析与模型', '确认创建'];

interface KBCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: KBCreateForm) => Promise<void>;
}

function validateStep(step: number, form: KBCreateForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    const name = form.name.trim();
    if (!name) errors.name = '请输入知识库名称';
    else if (name.length < 2) errors.name = '名称至少 2 个字符';
    else if (name.length > 50) errors.name = '名称最多 50 个字符';
    if (form.description.length > 200) errors.description = '描述最多 200 字符';
  }
  return errors;
}

export function KBCreateDialog({ open, onClose, onSubmit }: KBCreateDialogProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<KBCreateForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const patch = (partial: Partial<KBCreateForm>) => setForm(f => ({ ...f, ...partial }));

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    patch({
      icon: t.emoji,
      name: form.name || `${t.label}知识库`,
      description: form.description || t.desc,
      chunkStrategy: t.chunk,
      enableGraphRAG: t.graph,
    });
  };

  const resetAndClose = () => {
    setStep(0);
    setForm(DEFAULT_FORM);
    setErrors({});
    setSubmitting(false);
    onClose();
  };

  const goNext = () => {
    const e = validateStep(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const e = validateStep(0, form);
    setErrors(e);
    if (Object.keys(e).length > 0) { setStep(0); return; }
    setSubmitting(true);
    try {
      await onSubmit(form);
      resetAndClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">创建知识库</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">步骤 {step + 1}/{STEPS.length} · {STEPS[step]}</p>
          </div>
          <button type="button" onClick={resetAndClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X size={18} /></button>
        </div>

        <div className="px-6 pt-4 flex gap-1 flex-shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className={`text-[10px] ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">快速模板</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="flex items-start gap-2 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 text-left transition-colors"
                      >
                        <Icon size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.label}</div>
                          <div className="text-[10px] text-gray-500">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">图标</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => patch({ icon: ic })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${form.icon === ic ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  知识库名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => patch({ name: e.target.value })}
                  placeholder="2-50 字符，如：法务合同知识库"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 ${errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  描述 <span className="text-gray-400 font-normal text-xs">（{form.description.length}/200）</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => patch({ description: e.target.value.slice(0, 200) })}
                  placeholder="选填，简要说明知识库用途"
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:text-gray-100 ${errors.description ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">可见性</label>
                <div className="flex gap-3">
                  {([{ v: 'me' as const, l: '仅我', d: '仅创建者可见' }, { v: 'team' as const, l: '团队', d: '团队成员可访问' }]).map(o => (
                    <label
                      key={o.v}
                      className={`flex-1 p-3 border-2 rounded-xl cursor-pointer transition-colors ${form.visibility === o.v ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      <input type="radio" name="vis" checked={form.visibility === o.v} onChange={() => patch({ visibility: o.v })} className="sr-only" />
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{o.l}</div>
                      <div className="text-[10px] text-gray-500">{o.d}</div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">默认语言</label>
                  <select value={form.language} onChange={e => patch({ language: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                    <option>中文</option><option>English</option><option>日本語</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">分块策略</label>
                  <select value={form.chunkStrategy} onChange={e => patch({ chunkStrategy: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                    <option>通用分块</option><option>表格优先</option><option>代码感知</option>
                    <option>Laws（法律）</option><option>Paper（论文）</option><option>QA（问答对）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">嵌入模型</label>
                  <select value={form.embeddingModel} onChange={e => patch({ embeddingModel: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                    <option>BAAI/bge-m3</option><option>BCE-Embedding</option><option>text-embedding-3-small</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">LLM 模型</label>
                  <select value={form.llmModel} onChange={e => patch({ llmModel: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                    <option>DeepSeek-v4</option><option>Qwen3-72B</option><option>Claude-4</option><option>gpt-4o</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Reranker 模型</label>
                <select value={form.rerankerModel} onChange={e => patch({ rerankerModel: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                  <option>bge-reranker-v2-m3</option><option>bce-ranker-base_v1</option><option>cohere-rerank-v3</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">RAG 3.0 增强索引（可选）</label>
                {[
                  { key: 'enablePageIndex' as const, label: 'PageIndex 树索引', desc: '长文档层次化检索' },
                  { key: 'enableGraphRAG' as const, label: 'GraphRAG', desc: '实体关系图谱增强' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</div>
                      <div className="text-[10px] text-gray-500">{opt.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form[opt.key]}
                      onChange={e => patch({ [opt.key]: e.target.checked })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <span className="text-3xl">{form.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{form.name.trim()}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{form.description || '无描述'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['语言', form.language],
                  ['分块', form.chunkStrategy],
                  ['嵌入', form.embeddingModel],
                  ['LLM', form.llmModel],
                  ['Reranker', form.rerankerModel],
                  ['可见性', form.visibility === 'team' ? '团队' : '仅我'],
                ].map(([k, v]) => (
                  <div key={k} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-500">{k}</div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{v}</div>
                  </div>
                ))}
              </div>
              {(form.enablePageIndex || form.enableGraphRAG) && (
                <div className="flex flex-wrap gap-1.5">
                  {form.enablePageIndex && <span className="text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 rounded-full flex items-center gap-1"><Sparkles size={10} /> PageIndex</span>}
                  {form.enableGraphRAG && <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full flex items-center gap-1"><Sparkles size={10} /> GraphRAG</span>}
                </div>
              )}
              <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                创建后将进入知识库详情，可立即上传文档或调整配置。
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={step === 0 ? resetAndClose : goBack}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
          >
            {step === 0 ? '取消' : <><ChevronLeft size={14} /> 上一步</>}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              下一步 <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 min-w-[100px] justify-center"
            >
              {submitting ? <><Loader size={14} className="animate-spin" /> 创建中...</> : '创建知识库'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

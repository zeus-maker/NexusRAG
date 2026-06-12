import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { mockKBs } from '../mockData';
import type { AgentFlowNode } from '../data/agentMock';

interface AgentNodePropertyPanelProps {
  node: AgentFlowNode;
  onChange: (node: AgentFlowNode) => void;
  onClose: () => void;
}

export function AgentNodePropertyPanel({ node, onChange, onClose }: AgentNodePropertyPanelProps) {
  const patchConfig = (key: string, value: string | number | boolean | string[]) => {
    onChange({ ...node, config: { ...node.config, [key]: value } });
  };

  const renderFields = () => {
    switch (node.type) {
      case 'begin':
        return (
          <>
            <Field label="开场白 greeting">
              <input
                value={String(node.config.greeting ?? '')}
                onChange={e => patchConfig('greeting', e.target.value)}
                className="field-input"
              />
            </Field>
            <Field label="输入变量">
              <input
                value={Array.isArray(node.config.input_variables) ? node.config.input_variables.join(', ') : 'query'}
                onChange={e => patchConfig('input_variables', e.target.value.split(',').map(s => s.trim()))}
                placeholder="query, doc_id"
                className="field-input"
              />
            </Field>
          </>
        );
      case 'categorize':
        return (
          <>
            <Field label="分类 categories">
              <input value={String(node.config.categories ?? '')} onChange={e => patchConfig('categories', e.target.value)} className="field-input" />
            </Field>
            <Field label="LLM 模型">
              <select value={String(node.config.llm_model ?? 'DeepSeek-v4')} onChange={e => patchConfig('llm_model', e.target.value)} className="field-input">
                <option>DeepSeek-v4</option>
                <option>gpt-4o</option>
              </select>
            </Field>
            <Field label="Fallback Tier">
              <select value={String(node.config.fallback_tier ?? 'Tier2')} onChange={e => patchConfig('fallback_tier', e.target.value)} className="field-input">
                <option>Tier1</option>
                <option>Tier2</option>
                <option>Tier3</option>
              </select>
            </Field>
          </>
        );
      case 'retrieval':
        return (
          <>
            <Field label="知识库">
              <select
                value={Array.isArray(node.config.kb_ids) ? node.config.kb_ids[0] : 'kb-001'}
                onChange={e => patchConfig('kb_ids', [e.target.value])}
                className="field-input"
              >
                {mockKBs.slice(0, 5).map(kb => (
                  <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Top-K">
              <input type="number" min={1} max={20} value={Number(node.config.top_k ?? 5)} onChange={e => patchConfig('top_k', parseInt(e.target.value) || 5)} className="field-input" />
            </Field>
            <Field label="相似度阈值">
              <input type="number" step={0.05} min={0} max={1} value={Number(node.config.similarity_threshold ?? 0.2)} onChange={e => patchConfig('similarity_threshold', parseFloat(e.target.value))} className="field-input" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!node.config.rerank} onChange={e => patchConfig('rerank', e.target.checked)} className="rounded text-blue-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">启用 Rerank</span>
            </label>
            <Field label="检索通道">
              <input value={Array.isArray(node.config.channels) ? node.config.channels.join(', ') : 'vector'} onChange={e => patchConfig('channels', e.target.value.split(',').map(s => s.trim()))} className="field-input" />
            </Field>
          </>
        );
      case 'route_decision':
        return (
          <>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={node.config.use_global_matrix !== false} onChange={e => patchConfig('use_global_matrix', e.target.checked)} className="rounded text-blue-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">使用全局路由矩阵</span>
            </label>
            <Field label="覆盖规则 override_rules">
              <textarea value={String(node.config.override_rules ?? '')} onChange={e => patchConfig('override_rules', e.target.value)} rows={3} className="field-input resize-none" placeholder="JSON 规则…" />
            </Field>
          </>
        );
      case 'wiki_read':
        return (
          <>
            <Field label="知识库">
              <select value={String(node.config.kb_id ?? 'kb-001')} onChange={e => patchConfig('kb_id', e.target.value)} className="field-input">
                {mockKBs.slice(0, 3).map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
              </select>
            </Field>
            <Field label="Wiki 层级 layer">
              <select value={String(node.config.layer ?? 2)} onChange={e => patchConfig('layer', parseInt(e.target.value))} className="field-input">
                <option value={1}>Layer 1</option>
                <option value={2}>Layer 2</option>
                <option value={3}>Layer 3</option>
              </select>
            </Field>
            <Field label="页面 slugs">
              <input value={Array.isArray(node.config.page_slugs) ? node.config.page_slugs.join(', ') : ''} onChange={e => patchConfig('page_slugs', e.target.value.split(',').map(s => s.trim()))} className="field-input" />
            </Field>
          </>
        );
      case 'pageindex_search':
        return (
          <>
            <Field label="知识库">
              <select value={String(node.config.kb_id ?? 'kb-001')} onChange={e => patchConfig('kb_id', e.target.value)} className="field-input">
                {mockKBs.slice(0, 3).map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
              </select>
            </Field>
            <Field label="最大深度 max_depth">
              <input type="number" min={1} max={10} value={Number(node.config.max_depth ?? 3)} onChange={e => patchConfig('max_depth', parseInt(e.target.value) || 3)} className="field-input" />
            </Field>
          </>
        );
      case 'parser':
        return (
          <>
            <Field label="解析器 parser_id">
              <select value={String(node.config.parser_id ?? 'general')} onChange={e => patchConfig('parser_id', e.target.value)} className="field-input">
                <option value="general">通用</option>
                <option value="legal">法律文档</option>
                <option value="financial">财务报表</option>
              </select>
            </Field>
            <Field label="分块策略 chunk_strategy">
              <select value={String(node.config.chunk_strategy ?? 'semantic')} onChange={e => patchConfig('chunk_strategy', e.target.value)} className="field-input">
                <option value="semantic">语义分块</option>
                <option value="fixed">固定长度</option>
                <option value="pageindex">PageIndex 树</option>
              </select>
            </Field>
          </>
        );
      case 'tool':
        return (
          <>
            <Field label="MCP 服务器">
              <select value={String(node.config.mcp_server_id ?? 'fs-mcp')} onChange={e => patchConfig('mcp_server_id', e.target.value)} className="field-input">
                <option value="fs-mcp">文件系统 MCP</option>
                <option value="db-mcp">数据库 MCP</option>
              </select>
            </Field>
            <Field label="工具 tool_name">
              <select value={String(node.config.tool_name ?? 'read_file')} onChange={e => patchConfig('tool_name', e.target.value)} className="field-input">
                <option>read_file</option>
                <option>search_files</option>
                <option>list_dir</option>
              </select>
            </Field>
            <Field label="参数 params (JSON)">
              <textarea value={String(node.config.params ?? '{}')} onChange={e => patchConfig('params', e.target.value)} rows={3} className="field-input resize-none font-mono text-[10px]" />
            </Field>
          </>
        );
      case 'generate':
        return (
          <>
            <Field label="模型">
              <select value={String(node.config.model ?? 'DeepSeek-v4')} onChange={e => patchConfig('model', e.target.value)} className="field-input">
                <option>DeepSeek-v4</option>
                <option>gpt-4o</option>
              </select>
            </Field>
            <Field label={`温度 ${node.config.temperature ?? 0.1}`}>
              <input type="range" min={0} max={1} step={0.1} value={Number(node.config.temperature ?? 0.1)} onChange={e => patchConfig('temperature', parseFloat(e.target.value))} className="w-full" />
            </Field>
            <Field label="最大 Token">
              <input type="number" value={Number(node.config.max_tokens ?? 2048)} onChange={e => patchConfig('max_tokens', parseInt(e.target.value) || 2048)} className="field-input" />
            </Field>
            <Field label="System Prompt">
              <textarea value={String(node.config.system_prompt ?? '')} onChange={e => patchConfig('system_prompt', e.target.value)} rows={3} className="field-input resize-none" />
            </Field>
          </>
        );
      case 'answer':
        return (
          <>
            <Field label="输出模板 template">
              <input value={String(node.config.template ?? '{{answer}}')} onChange={e => patchConfig('template', e.target.value)} className="field-input" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={node.config.show_citations !== false} onChange={e => patchConfig('show_citations', e.target.checked)} className="rounded text-blue-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">显示引用 show_citations</span>
            </label>
          </>
        );
      default:
        return <p className="text-xs text-gray-400">暂无该节点类型的配置表单</p>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{node.label}</h3>
          <p className="text-[10px] text-gray-500 capitalize">{node.type}</p>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {renderFields()}
      </div>
      <style>{`.field-input{width:100%;padding:0.375rem 0.5rem;font-size:0.75rem;border:1px solid #d1d5db;border-radius:0.5rem;background:#fff}.dark .field-input{border-color:#4b5563;background:#1f2937;color:#e5e7eb}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-gray-600 dark:text-gray-400 block mb-0.5">{label}</label>
      {children}
    </div>
  );
}

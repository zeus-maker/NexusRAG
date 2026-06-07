import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, GitBranch, BookOpen, Network, Layers } from 'lucide-react';
import {
  CHUNK_METHOD_OPTIONS,
  type DocumentUploadConfig,
} from '../../data/documentUploadConfig';

interface Props {
  config: DocumentUploadConfig;
  onChange: (patch: Partial<DocumentUploadConfig>) => void;
  fileCount?: number;
  compact?: boolean;
}

export function DocumentUploadConfigPanel({ config, onChange, fileCount, compact }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : ''}`}>
      {fileCount != null && fileCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          已选择 <span className="font-semibold text-gray-800 dark:text-gray-200">{fileCount}</span> 个文件，以下配置将应用于本次上传与解析。
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">分块策略（chunk_method）</label>
        <select
          value={config.chunkMethod}
          onChange={e => onChange({ chunkMethod: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          {CHUNK_METHOD_OPTIONS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-1">
          {CHUNK_METHOD_OPTIONS.find(m => m.value === config.chunkMethod)?.hint}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        分块参数（chunk_token_num / delimiter）
      </button>
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 pl-1">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Token 数</label>
            <input
              type="number"
              min={128}
              max={2048}
              value={config.chunkTokenNum}
              onChange={e => onChange({ chunkTokenNum: Number(e.target.value) || 512 })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">分隔符</label>
            <input
              value={config.delimiter}
              onChange={e => onChange({ delimiter: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-gray-500 mb-1">版面识别</label>
            <select
              value={config.layoutRecognize}
              onChange={e => onChange({ layoutRecognize: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            >
              <option value="DeepDOC">DeepDOC</option>
              <option value="Plain Text">Plain Text</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">增强索引（RAG3 扩展）</p>
        <div className="space-y-2">
          <IndexToggle
            icon={<Layers size={14} className="text-blue-500" />}
            label="向量 + 全文（必选）"
            desc="嵌入向量与 BM25 全文索引"
            checked
            locked
            onChange={() => {}}
          />
          <IndexToggle
            icon={<GitBranch size={14} className="text-cyan-500" />}
            label="PageIndex 树索引"
            desc="层次化文档树，适合长文档精确检索"
            checked={config.enablePageIndex}
            onChange={v => onChange({ enablePageIndex: v })}
          />
          <IndexToggle
            icon={<Network size={14} className="text-green-500" />}
            label="知识图谱（GraphRAG）"
            desc="实体关系抽取与多跳推理"
            checked={config.enableGraphRag}
            onChange={v => onChange({ enableGraphRag: v })}
          />
          {config.enableGraphRag && (
            <select
              value={config.graphRagMethod}
              onChange={e => onChange({ graphRagMethod: e.target.value as DocumentUploadConfig['graphRagMethod'] })}
              className="ml-7 w-[calc(100%-1.75rem)] px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            >
              <option value="light">Light（轻量）</option>
              <option value="general">General</option>
              <option value="ner">NER</option>
            </select>
          )}
          <IndexToggle
            icon={<BookOpen size={14} className="text-violet-500" />}
            label="LLM Wiki 汇总"
            desc="Ingest 编译实体 Wiki 页面（Karpathy 工作流）"
            checked={config.enableWiki}
            onChange={v => onChange({ enableWiki: v })}
          />
          <IndexToggle
            icon={<Layers size={14} className="text-amber-500" />}
            label="RAPTOR 层次摘要"
            desc="RAGFlow 内置层次聚类摘要索引"
            checked={config.enableRaptor}
            onChange={v => onChange({ enableRaptor: v })}
          />
        </div>
      </div>

      <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-700 dark:text-gray-300">上传后立即解析</span>
        <input
          type="checkbox"
          checked={config.autoParse}
          onChange={e => onChange({ autoParse: e.target.checked })}
          className="rounded text-blue-600"
        />
      </label>
    </div>
  );
}

function IndexToggle({
  icon,
  label,
  desc,
  checked,
  locked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
      checked ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700'
    } ${locked ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 rounded text-blue-600"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">
          {icon}
          {label}
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

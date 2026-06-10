import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { chatService, type QueryParseResult } from '../services/chatService';
import { useRealApi } from '../services/http';

const SYNTAX_HELP = [
  'field:value — 元数据过滤（department / type / date / author）',
  'AND / OR / NOT — 布尔组合',
  '"精确短语" — 引号包裹',
  'page:3-5 — 页码范围',
];

interface ChatQuerySyntaxProps {
  query: string;
  onParsed?: (result: QueryParseResult | null) => void;
}

export function ChatQuerySyntax({ query, onParsed }: ChatQuerySyntaxProps) {
  const [parsed, setParsed] = useState<QueryParseResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setParsed(null);
      onParsed?.(null);
      return;
    }
    const hasSyntax = /[:\"]|\b(AND|OR|NOT)\b/i.test(query);
    if (!hasSyntax) {
      setParsed(null);
      onParsed?.(null);
      return;
    }
    const timer = window.setTimeout(() => {
      if (useRealApi) {
        void chatService.parseQuery(query).then(res => {
          setParsed(res);
          onParsed?.(res);
        }).catch(() => {
          setParsed(null);
          onParsed?.(null);
        });
      } else {
        const mock: QueryParseResult = {
          original: query,
          free_text: query.replace(/\w+:[^\s]+/g, '').trim() || query,
          metadata_filters: { conditions: [], logical_operator: 'and' },
          autocomplete_hints: [],
        };
        setParsed(mock);
        onParsed?.(mock);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, onParsed]);

  const showPanel = showHelp || (parsed?.autocomplete_hints?.length ?? 0) > 0
    || (parsed?.metadata_filters?.conditions?.length ?? 0) > 0;

  if (!showPanel && !query.includes(':')) {
    return (
      <button
        type="button"
        onClick={() => setShowHelp(v => !v)}
        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
        title="高级检索语法"
      >
        <HelpCircle size={18} />
      </button>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setShowHelp(v => !v)}
        className={`p-2 rounded-lg ${showHelp ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        title="高级检索语法"
      >
        <HelpCircle size={18} />
      </button>
      {(showHelp || parsed) && (
        <div className="absolute bottom-full left-0 mb-2 w-80 z-20 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-xs">
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">语法帮助</p>
          <ul className="space-y-1 text-gray-500 dark:text-gray-400 mb-2">
            {SYNTAX_HELP.map(line => <li key={line}>· {line}</li>)}
          </ul>
          {parsed?.metadata_filters?.conditions?.length ? (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-1">已解析过滤</p>
              {parsed.metadata_filters.conditions.map((c, i) => (
                <span key={i} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded text-[10px]">
                  {c.name}:{String(c.value)}
                </span>
              ))}
              {parsed.free_text && parsed.free_text !== parsed.original && (
                <p className="text-[10px] text-gray-500 mt-1">检索词：{parsed.free_text}</p>
              )}
            </div>
          ) : null}
          {parsed?.autocomplete_hints?.length ? (
            <div>
              <p className="text-[10px] text-gray-500 mb-1">自动补全</p>
              <div className="flex flex-wrap gap-1">
                {parsed.autocomplete_hints.map((h, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                    {h.field}:{h.value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

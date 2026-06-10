import { Children, cloneElement, isValidElement, useMemo, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import type { Citation } from '../types';

const CITE_RE = /\[(\d+)\]/g;

type CitationPart = { type: 'text' | 'cite'; value: string; idx?: number };

function splitCitationParts(content: string): CitationPart[] {
  const parts: CitationPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  CITE_RE.lastIndex = 0;
  while ((match = CITE_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'cite', value: match[0], idx: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push({ type: 'text', value: content.slice(lastIndex) });
  if (parts.length === 0) parts.push({ type: 'text', value: content });
  return parts;
}

interface CitationInlineProps {
  text: string;
  citations: Citation[];
  activeIndex: number | null;
  onToggle: (cite: Citation) => void;
}

function CitationInline({ text, citations, activeIndex, onToggle }: CitationInlineProps) {
  return (
    <>
      {splitCitationParts(text).map((part, i) => {
        if (part.type === 'cite' && part.idx != null) {
          const cite = citations.find(c => c.index === part.idx);
          const active = cite && activeIndex === cite.index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => cite && onToggle(cite)}
              className={`inline-flex items-center justify-center min-w-[1rem] h-4 px-0.5 text-white text-[9px] font-bold rounded mx-0.5 align-middle transition-colors ${
                active ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {part.idx}
            </button>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

function injectCitations(
  children: ReactNode,
  citations: Citation[],
  activeIndex: number | null,
  onToggle: (cite: Citation) => void,
): ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child === 'string') {
      return (
        <CitationInline
          key={i}
          text={child}
          citations={citations}
          activeIndex={activeIndex}
          onToggle={onToggle}
        />
      );
    }
    if (isValidElement(child) && child.props.children != null) {
      return cloneElement(child, {
        ...child.props,
        children: injectCitations(child.props.children, citations, activeIndex, onToggle),
      });
    }
    return child;
  });
}

interface ChatMarkdownContentProps {
  text: string;
  citations: Citation[];
  onCiteClick?: (c: Citation) => void;
}

export function ChatMarkdownContent({ text, citations, onCiteClick }: ChatMarkdownContentProps) {
  const [activeCite, setActiveCite] = useState<Citation | null>(null);

  const handleToggle = (cite: Citation) => {
    setActiveCite(prev => (prev?.index === cite.index ? null : cite));
    onCiteClick?.(cite);
  };

  const wrap = (children: ReactNode) =>
    injectCitations(children, citations, activeCite?.index ?? null, handleToggle);

  const components = useMemo<Components>(
    () => ({
      h1: ({ children }) => (
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2 first:mt-0">{wrap(children)}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1.5 first:mt-0">{wrap(children)}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1 first:mt-0">{wrap(children)}</h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1 first:mt-0">{wrap(children)}</h4>
      ),
      p: ({ children }) => (
        <p className="mb-2 last:mb-0 leading-relaxed">{wrap(children)}</p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
      ),
      li: ({ children }) => (
        <li className="leading-relaxed">{wrap(children)}</li>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-300 dark:border-blue-700 pl-3 my-2 text-gray-600 dark:text-gray-400 italic">
          {wrap(children)}
        </blockquote>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {children}
        </a>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100">{wrap(children)}</strong>
      ),
      em: ({ children }) => <em className="italic">{wrap(children)}</em>,
      hr: () => <hr className="my-3 border-gray-200 dark:border-gray-700" />,
      table: ({ children }) => (
        <div className="my-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-gray-700">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-gray-50 dark:bg-gray-800/80">{children}</thead>
      ),
      th: ({ children }) => (
        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{wrap(children)}</th>
      ),
      td: ({ children }) => (
        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800">{wrap(children)}</td>
      ),
      code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className?.includes('language-'));
        if (isBlock) {
          return (
            <code className={`${className ?? ''} font-mono text-[12px]`} {...props}>
              {children}
            </code>
          );
        }
        return (
          <code
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[13px] font-mono text-pink-700 dark:text-pink-300 rounded"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="my-2 p-3 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg overflow-x-auto text-xs leading-relaxed">
          {children}
        </pre>
      ),
    }),
    [citations, activeCite],
  );

  if (!text.trim()) return null;

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed chat-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
      {activeCite && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded flex items-center justify-center">
                  {activeCite.index}
                </span>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">{activeCite.doc_name}</span>
                <span className="text-[10px] text-blue-600">P{activeCite.page_number}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">&ldquo;{activeCite.snippet}&rdquo;</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-blue-200 rounded-full">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${activeCite.relevance_score * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-blue-700">
                  {(activeCite.relevance_score * 100).toFixed(1)}%
                </span>
                <button type="button" className="text-[10px] text-blue-600 hover:underline">
                  查看原文
                </button>
              </div>
            </div>
            <button type="button" onClick={() => setActiveCite(null)} className="text-gray-400">
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

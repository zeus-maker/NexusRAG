import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import type { Chunk } from '../../types';
import { getDocumentPreviewKind } from '../../utils/documentUtil';
import { DocumentIframePreview } from './DocumentIframePreview';
import { PdfPreviewWithHighlights } from './PdfPreviewWithHighlights';
import type { PdfHighlightRect } from '../../utils/documentUtil';

interface Props {
  fileName: string;
  fileType?: string;
  url: string | null;
  highlights?: PdfHighlightRect[];
  /** 表格类文档可回退展示选中分块的 HTML 表格 */
  selectedChunk?: Chunk | null;
  className?: string;
}

function TextPreview({ url, asMarkdown }: { url: string; asMarkdown?: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setText(null);
    setError(null);
    fetch(url)
      .then(r => r.text())
      .then(t => { if (!cancelled) setText(t); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : '加载失败'); });
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <p className="text-xs text-red-600 p-4">{error}</p>;
  if (text === null) return <p className="text-xs text-gray-500 p-4">加载文本…</p>;

  if (asMarkdown) {
    return (
      <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 overflow-auto h-full">
        {text}
      </pre>
    );
  }

  return (
    <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-auto h-full">
      {text}
    </pre>
  );
}

function CsvTablePreview({ url }: { url: string }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.text())
      .then(raw => {
        if (cancelled) return;
        const lines = raw.split(/\r?\n/).filter(l => l.trim());
        const parsed = lines.slice(0, 200).map(line => {
          const cells: string[] = [];
          let cur = '';
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQ = !inQ; continue; }
            if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
            cur += ch;
          }
          cells.push(cur.trim());
          return cells;
        });
        setRows(parsed);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : '解析失败'); });
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <p className="text-xs text-red-600 p-4">{error}</p>;
  if (!rows?.length) return <p className="text-xs text-gray-500 p-4">加载 CSV…</p>;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-auto h-full p-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {header.map((c, i) => (
              <th key={i} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {row.map((c, ci) => (
                <td key={ci} className="border border-gray-200 dark:border-gray-700 px-2 py-1 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExcelTablePreview({ url }: { url: string }) {
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        if (cancelled) return;
        const wb = XLSX.read(buf, { type: 'array' });
        const parsed = wb.SheetNames.map(name => {
          const sheet = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
          return { name, rows: rows.slice(0, 300) };
        });
        setSheets(parsed);
        setActiveSheet(0);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Excel 解析失败'); });
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <p className="text-xs text-red-600 p-4">{error}</p>;
  if (!sheets?.length) return <p className="text-xs text-gray-500 p-4">加载 Excel…</p>;

  const sheet = sheets[activeSheet];
  const header = sheet.rows[0] ?? [];
  const body = sheet.rows.slice(1);

  return (
    <div className="flex flex-col h-full min-h-0">
      {sheets.length > 1 && (
        <div className="flex-shrink-0 flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSheet(i)}
              className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap ${
                i === activeSheet ? 'bg-cyan-50 border-cyan-300 text-cyan-800' : 'border-gray-200 text-gray-600'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto p-2">
        <table className="w-full text-xs border-collapse min-w-max">
          {header.length > 0 && (
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                {header.map((c, i) => (
                  <th key={i} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-semibold">
                    {String(c)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {(row.length ? row : header.map(() => '')).map((c, ci) => (
                  <td key={ci} className="border border-gray-200 dark:border-gray-700 px-2 py-1 align-top">
                    {String(c ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChunkTableFallback({ chunk }: { chunk: Chunk }) {
  const html = chunk.content_html || chunk.content_preview;
  if (html.includes('<table') || chunk.content_type === 'table') {
    return (
      <div
        className="p-3 text-xs overflow-auto h-full prose-table:text-xs"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <pre className="p-4 text-xs whitespace-pre-wrap overflow-auto h-full text-gray-700">
      {chunk.content_preview}
    </pre>
  );
}

export function DocumentMultiFormatPreview({
  fileName,
  fileType,
  url,
  highlights = [],
  selectedChunk,
  className = '',
}: Props) {
  const kind = getDocumentPreviewKind(fileName, fileType);

  if (!url) {
    if (selectedChunk && (kind === 'excel' || kind === 'csv' || kind === 'unknown')) {
      return <ChunkTableFallback chunk={selectedChunk} />;
    }
    return <p className="text-xs text-gray-500 p-4">无法加载原始文件预览</p>;
  }

  if (kind === 'pdf') {
    return (
      <PdfPreviewWithHighlights
        url={url}
        highlights={highlights}
        className={`flex-1 h-0 min-h-0 ${className}`}
      />
    );
  }

  if (kind === 'image') {
    return (
      <div className={`flex items-center justify-center overflow-auto p-4 bg-gray-100 dark:bg-gray-800 h-full ${className}`}>
        <img src={url} alt={fileName} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  if (kind === 'excel') {
    return (
      <div className={`flex-1 h-0 min-h-0 overflow-hidden ${className}`}>
        <ExcelTablePreview url={url} />
      </div>
    );
  }

  if (kind === 'csv') {
    return (
      <div className={`flex-1 h-0 min-h-0 overflow-hidden ${className}`}>
        <CsvTablePreview url={url} />
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className={`flex-1 h-0 min-h-0 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
        <TextPreview url={url} />
      </div>
    );
  }

  if (kind === 'markdown') {
    return (
      <div className={`flex-1 h-0 min-h-0 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
        <TextPreview url={url} asMarkdown />
      </div>
    );
  }

  if (kind === 'html') {
    return <DocumentIframePreview url={url} title={fileName} className={className} />;
  }

  if (kind === 'office') {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 p-6 text-center h-full ${className}`}>
        <p className="text-sm text-gray-600">Office 文档（{fileName}）暂不支持内嵌预览</p>
        <p className="text-xs text-gray-400">请使用右侧分块内容查看解析结果，或点击下载原始文件</p>
        {selectedChunk && (
          <div className="w-full flex-1 min-h-0 mt-2 border border-gray-200 rounded-lg overflow-hidden text-left">
            <ChunkTableFallback chunk={selectedChunk} />
          </div>
        )}
      </div>
    );
  }

  if (selectedChunk) {
    return <ChunkTableFallback chunk={selectedChunk} />;
  }

  return <DocumentIframePreview url={url} title={fileName} className={className} />;
}

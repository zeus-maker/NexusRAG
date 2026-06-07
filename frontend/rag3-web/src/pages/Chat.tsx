import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Search, Send, ThumbsUp, ThumbsDown, Edit3, ChevronRight, ChevronDown,
  BookOpen, Layers, Zap, Copy, RefreshCw, X, Clock, Trash2, Pin, PinOff,
  Settings, Paperclip, GitCompare, Square, Check, MessageSquare
} from 'lucide-react';
import { mockConversations, mockKBs } from '../mockData';
import type { ChatMessage, Citation, Conversation } from '../types';
import { ChatSettingsPanel, DEFAULT_CHAT_SETTINGS, type ChatSettings } from '../components/ChatSettingsPanel';
import { CONV_MESSAGES, CONV_PINNED, QUERY_TRACE_STEPS } from '../data/chatMock';
import { consumePageIndexChatPrefill } from '../utils/pageIndexChatPrefill';

const SAMPLE_RESPONSES = [
  {
    question: '供应商延迟交货的违约金如何计算？',
    content: `根据公司**标准采购合同模板（V5）第五条**的违约责任条款，供应商迟延交货的违约金计算规则如下：

**1. 基本违约金**
供应商迟延交货的，每迟延一日应按迟延交付货物**价值的千分之五（0.5%）**[1]向采购方支付违约金。

**2. 解除合同权利**
迟延超过 **30 日**的，采购方有权解除合同[2]，并要求供应商赔偿因此造成的全部损失。

**3. 违约金上限**
累计违约金不超过合同标的总金额的 **20%**[1]。

**4. 不可抗力例外**
因不可抗力导致的延迟不适用上述违约金条款，但供应商需在 48 小时内书面通知采购方[3]。`,
    citations: [
      { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.1', snippet: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金，累计违约金不超过合同总额20%。', relevance_score: 0.956 },
      { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.2', snippet: '迟延超过三十日的，采购方有权解除合同并要求赔偿全部实际损失。', relevance_score: 0.932 },
      { index: 3, doc_name: '供应商合同模板V5.pdf', page_number: 5, section: '第七条 不可抗力', snippet: '因不可抗力导致无法履约的，受影响方应在48小时内以书面形式通知对方。', relevance_score: 0.878 },
    ],
    confidence: 0.92, tier: 'Tier 2', channels: ['PageIndex', '向量检索'], latency: 2100,
    compareB: '根据相关采购条款，违约金比例通常在 **0.3%–0.5%** 区间[1]，具体以合同约定为准。部分旧版合同为千分之三[2]。',
  },
  {
    question: '保密协议的保密期限是多久？',
    content: `根据**保密协议条款（§8.2）**，保密义务的期限规定如下：

**标准保密期限**
- 合同**履行期间**[1]：全程保密义务
- 合同**终止或解除后 5 年**[1]：保密义务延续

**例外情形**
以下情形不受保密义务约束：
- 信息已成为公众知识且与被保密方无关[2]
- 信息系从第三方合法获取[2]
- 法律法规或政府命令要求披露的信息[2]`,
    citations: [
      { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 保密义务 §8.2', snippet: '保密期限为合同履行期间及合同终止或解除后5年。', relevance_score: 0.978 },
      { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 保密义务 §8.3', snippet: '以下情形不适用保密义务：已成公众知识、合法从第三方获取、法律强制要求披露。', relevance_score: 0.941 },
    ],
    confidence: 0.95, tier: 'Tier 1', channels: ['向量检索'], latency: 850,
    compareB: '标准保密期为合同期内及终止后 **3–5 年**[1]，具体年限需查阅各版本模板。',
  },
];

function formatCitationText(content: string) {
  const parts: Array<{ type: 'text' | 'cite'; value: string; idx?: number }> = [];
  let lastIndex = 0;
  const regex = /\[(\d+)\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    parts.push({ type: 'cite', value: match[0], idx: parseInt(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push({ type: 'text', value: content.slice(lastIndex) });
  return parts;
}

function MarkdownContent({ text, citations, onCiteClick }: { text: string; citations: Citation[]; onCiteClick?: (c: Citation) => void }) {
  const [activeCite, setActiveCite] = useState<Citation | null>(null);

  const renderInline = (line: string, key: number) => {
    const parts = formatCitationText(line);
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.type === 'cite' && p.idx) {
            const cite = citations.find(c => c.index === p.idx);
            return (
              <button
                key={i}
                type="button"
                onClick={() => { if (cite) { setActiveCite(activeCite?.index === cite.index ? null : cite); onCiteClick?.(cite); } }}
                className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded mx-0.5 hover:bg-blue-700 align-middle"
              >
                {p.idx}
              </button>
            );
          }
          const seg = p.value;
          if (seg.includes('**')) {
            return <span key={i}>{seg.split('**').map((s, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{s}</strong> : s)}</span>;
          }
          return <span key={i}>{seg}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-0.5">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2), i)}</li>;
        if (line === '') return <br key={i} />;
        return <p key={i} className="mb-0.5">{renderInline(line, i)}</p>;
      })}
      {activeCite && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded flex items-center justify-center">{activeCite.index}</span>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">{activeCite.doc_name}</span>
                <span className="text-[10px] text-blue-600">P{activeCite.page_number}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{activeCite.snippet}"</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-blue-200 rounded-full"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${activeCite.relevance_score * 100}%` }} /></div>
                <span className="text-[10px] text-blue-700">{(activeCite.relevance_score * 100).toFixed(1)}%</span>
                <button type="button" className="text-[10px] text-blue-600 hover:underline">查看原文</button>
              </div>
            </div>
            <button type="button" onClick={() => setActiveCite(null)} className="text-gray-400"><X size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function QueryTraceTimeline({ expanded, onViewFull }: { expanded: boolean; onViewFull?: () => void }) {
  if (!expanded) return null;
  const total = QUERY_TRACE_STEPS.reduce((s, x) => s + x.ms, 0);
  return (
    <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
      <p className="text-[10px] font-semibold text-gray-500 mb-2">查询链路 Trace · 总计 {(total / 1000).toFixed(1)}s</p>
      <div className="space-y-1.5">
        {QUERY_TRACE_STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className="w-14 text-gray-500 flex-shrink-0">{step.stage}</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(step.ms / 1400) * 100}%` }} />
            </div>
            <span className="w-10 text-right text-gray-600 dark:text-gray-400">{step.ms}ms</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-gray-400 mt-1.5">{QUERY_TRACE_STEPS.map(s => s.detail).join(' → ')}</p>
      {onViewFull && (
        <button type="button" onClick={onViewFull} className="mt-2 text-[10px] text-blue-600 hover:underline">
          查看完整 Trace →
        </button>
      )}
    </div>
  );
}

interface ChatPageProps {
  convId: string | null;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function ChatPage({ convId, onNavigate }: ChatPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [pinned, setPinned] = useState<Set<string>>(new Set(CONV_PINNED));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [currentConv, setCurrentConv] = useState<string | null>(convId);
  const [convSearch, setConvSearch] = useState('');
  const [showKBPicker, setShowKBPicker] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'up' | 'down' | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [lastCompareB, setLastCompareB] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  useEffect(() => {
    const prefill = consumePageIndexChatPrefill();
    if (!prefill) return;
    setInput(prefill.query);
    setCurrentConv(null);
    setMessages([]);
    setChatSettings(s => ({
      ...s,
      kbIds: prefill.kbId ? [prefill.kbId] : s.kbIds,
      convTitle: prefill.docName ? `PageIndex · ${prefill.docName}` : 'PageIndex 对话测试',
    }));
    showToast(
      prefill.docName
        ? `已载入 PageIndex 测试查询（${prefill.docName}），按 Enter 发送`
        : '已载入 PageIndex 测试查询，按 Enter 发送',
    );
  }, []);

  const loadConversation = useCallback((id: string) => {
    const conv = conversations.find(c => c.conv_id === id);
    if (!conv) return;
    setCurrentConv(id);
    setMessages(CONV_MESSAGES[id] ? [...CONV_MESSAGES[id]] : []);
    setChatSettings(s => ({
      ...s,
      convTitle: conv.title,
      kbIds: [...conv.kb_ids],
    }));
    onNavigate('chat', { selectedConvId: id });
  }, [conversations, onNavigate]);

  useEffect(() => {
    if (convId && convId !== currentConv) loadConversation(convId);
  }, [convId, currentConv, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopStream = () => {
    if (streamRef.current) clearInterval(streamRef.current);
    streamRef.current = null;
    setIsStreaming(false);
    setMessages(prev => prev.map(m => m.is_streaming ? { ...m, is_streaming: false } : m));
  };

  const sendMessage = (text: string = input) => {
    if (!text.trim() || isStreaming) return;
    if (!chatSettings.streaming) {
      setInput('');
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);
      finishResponse(text, messages.length);
      return;
    }
    setInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    startStreamingResponse(text, messages.length + 1);
  };

  const startStreamingResponse = (text: string, msgCount: number) => {
    const sample = SAMPLE_RESPONSES.find(s => text.includes(s.question.slice(0, 8))) || SAMPLE_RESPONSES[msgCount % 2] || SAMPLE_RESPONSES[0];
    setLastCompareB(sample.compareB || '');
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', citations: [], confidence: 0, is_streaming: true, created_at: new Date().toISOString() }]);
    setIsStreaming(true);
    const fullContent = sample.content;
    let charIndex = 0;
    streamRef.current = setInterval(() => {
      charIndex += Math.floor(Math.random() * 6) + 3;
      if (charIndex >= fullContent.length) {
        if (streamRef.current) clearInterval(streamRef.current);
        streamRef.current = null;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, content: fullContent, citations: sample.citations, confidence: sample.confidence,
          confidence_level: 'high', routing_tier: sample.tier, channels: sample.channels,
          latency_ms: sample.latency, is_streaming: false,
        } : m));
        setIsStreaming(false);
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent.slice(0, charIndex) } : m));
      }
    }, 25);
  };

  const finishResponse = (text: string, msgCount: number) => {
    const sample = SAMPLE_RESPONSES[msgCount % 2] || SAMPLE_RESPONSES[0];
    setLastCompareB(sample.compareB || '');
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(), role: 'assistant', content: sample.content,
      citations: sample.citations, confidence: sample.confidence, confidence_level: 'high',
      routing_tier: sample.tier, channels: sample.channels, latency_ms: sample.latency,
      created_at: new Date().toISOString(),
    }]);
  };

  const regenerateLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser || isStreaming) return;
    setMessages(prev => {
      const idx = prev.findLastIndex(m => m.role === 'assistant');
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    startStreamingResponse(lastUser.content, messages.length);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard?.writeText(content);
    showToast('已复制到剪贴板');
  };

  const newConversation = () => {
    stopStream();
    setMessages([]);
    setCurrentConv(null);
    setChatSettings({ ...DEFAULT_CHAT_SETTINGS, kbIds: chatSettings.kbIds });
    onNavigate('chat', { selectedConvId: null });
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.conv_id !== id));
    if (currentConv === id) newConversation();
    showToast('对话已删除');
  };

  const togglePin = (id: string) => {
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredConvs = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    return conversations.filter(c =>
      !q || c.title.toLowerCase().includes(q) || (c.last_message || '').toLowerCase().includes(q)
    );
  }, [conversations, convSearch]);

  const groupConvs = useMemo(() => {
    const pinnedList = filteredConvs.filter(c => pinned.has(c.conv_id));
    const rest = filteredConvs.filter(c => !pinned.has(c.conv_id));
    return { pinned: pinnedList, today: rest.slice(0, 2), yesterday: rest.slice(2, 4), earlier: rest.slice(4) };
  }, [filteredConvs, pinned]);

  const selectedKBNames = chatSettings.kbIds.map(id => mockKBs.find(k => k.kb_id === id)?.name).filter(Boolean);

  const suggestions = [
    { text: '供应商违约金上限是多少？', tag: '精确化' },
    { text: '对比不同合同的违约条款', tag: '跨文档' },
    { text: '采购合同的保密条款包含哪些？', tag: '' },
    { text: '合同解除需要满足哪些条件？', tag: '' },
  ];

  const renderConvItem = (conv: Conversation) => (
    <div key={conv.conv_id} className={`group relative mb-0.5 ${currentConv === conv.conv_id ? 'bg-blue-50 dark:bg-blue-900/30 rounded-lg' : ''}`}>
      <button
        type="button"
        onClick={() => loadConversation(conv.conv_id)}
        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors pr-16"
      >
        <div className="flex items-start gap-2">
          {pinned.has(conv.conv_id) ? <Pin size={10} className="mt-0.5 text-amber-500 flex-shrink-0" /> : <MessageSquare size={10} className="mt-0.5 text-gray-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${currentConv === conv.conv_id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{conv.title}</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{conv.last_message}</p>
            <div className="flex gap-1 mt-1">
              {conv.kb_ids.slice(0, 2).map(kid => {
                const kb = mockKBs.find(k => k.kb_id === kid);
                return kb ? <span key={kid} className="text-[9px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{kb.icon}</span> : null;
              })}
            </div>
          </div>
        </div>
      </button>
      <div className="absolute right-1 top-2 opacity-0 group-hover:opacity-100 flex gap-0.5">
        <button type="button" onClick={() => togglePin(conv.conv_id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
          {pinned.has(conv.conv_id) ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button type="button" onClick={() => deleteConversation(conv.conv_id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-gray-50/30 dark:bg-gray-950">
      {toast && <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}

      {/* 对话历史 */}
      <div className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <button type="button" onClick={newConversation} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={15} /> 新对话
          </button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={convSearch} onChange={e => setConvSearch(e.target.value)} placeholder="搜索对话..." className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-100" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {groupConvs.pinned.length > 0 && (
            <>
              <p className="text-[10px] text-gray-400 font-medium px-2 py-1">置顶</p>
              {groupConvs.pinned.map(renderConvItem)}
            </>
          )}
          {groupConvs.today.length > 0 && <><p className="text-[10px] text-gray-400 font-medium px-2 py-1 mt-1">今天</p>{groupConvs.today.map(renderConvItem)}</>}
          {groupConvs.yesterday.length > 0 && <><p className="text-[10px] text-gray-400 font-medium px-2 py-1 mt-1">昨天</p>{groupConvs.yesterday.map(renderConvItem)}</>}
          {groupConvs.earlier.length > 0 && <><p className="text-[10px] text-gray-400 font-medium px-2 py-1 mt-1">更早</p>{groupConvs.earlier.map(renderConvItem)}</>}
        </div>
        <div className="p-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button type="button" onClick={() => { setShowPanel(p => !p); setShowSettings(false); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg ${showPanel ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            <Layers size={13} /> 查询增强
          </button>
        </div>
      </div>

      {/* 主对话区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 flex-shrink-0 truncate max-w-[120px]">{chatSettings.convTitle}</span>
          <span className="text-gray-300">·</span>
          <div className="relative">
            <button type="button" onClick={() => setShowKBPicker(p => !p)} className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
              <BookOpen size={11} />{selectedKBNames.join('、') || '选择知识库'}<ChevronDown size={11} />
            </button>
            {showKBPicker && (
              <div className="absolute top-8 left-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto">
                {mockKBs.map(kb => (
                  <button key={kb.kb_id} type="button" onClick={() => setChatSettings(s => ({ ...s, kbIds: s.kbIds.includes(kb.kb_id) ? s.kbIds.filter(id => id !== kb.kb_id) : [...s.kbIds, kb.kb_id] }))} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${chatSettings.kbIds.includes(kb.kb_id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {chatSettings.kbIds.includes(kb.kb_id) && <Check size={10} className="text-white" />}
                    </div>
                    <span>{kb.icon}</span><span className="text-xs truncate">{kb.name}</span>
                  </button>
                ))}
                <div className="p-2 border-t"><button type="button" onClick={() => setShowKBPicker(false)} className="w-full text-xs text-blue-600">确认</button></div>
              </div>
            )}
          </div>
          <div className="flex-1" />
          <button type="button" onClick={() => setShowCompare(p => !p)} className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border ${showCompare ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'}`}>
            <GitCompare size={12} /> 答案对比
          </button>
          <button type="button" onClick={() => { setShowSettings(p => !p); setShowPanel(false); }} className={`p-1.5 rounded-lg ${showSettings ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800'}`}>
            <Settings size={15} />
          </button>
          {messages.length > 0 && (
            <button type="button" onClick={() => { if (confirm('清除当前对话消息？')) setMessages([]); }} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={12} /> 清除
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-16">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Zap size={24} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">RAG 3.0 智能问答</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{chatSettings.opener}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => sendMessage(s.text)} className="text-left p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:border-blue-300 transition-all group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{s.text}</span>
                      {s.tag && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded flex-shrink-0">{s.tag}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-2xl ${msg.role === 'user' ? '' : 'flex-1 min-w-0'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm inline-block max-w-lg">{msg.content}</div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    {msg.routing_tier && !msg.is_streaming && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] rounded font-medium">{msg.routing_tier}</span>
                        {msg.channels?.map(c => <span key={c} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] rounded">{c}</span>)}
                        {msg.confidence_level && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${msg.confidence_level === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            置信度 {msg.confidence_level === 'high' ? '高' : '中'}
                          </span>
                        )}
                      </div>
                    )}
                    {showCompare && !msg.is_streaming && msg.content && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-2 bg-violet-50/50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                        <div className="text-[10px]">
                          <span className="font-semibold text-violet-700 dark:text-violet-300">策略 A · PageIndex 主通道</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-4">{msg.content.slice(0, 120)}…</p>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-semibold text-violet-700 dark:text-violet-300">策略 B · 纯向量</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{lastCompareB || '向量通道召回结果略有差异…'}</p>
                        </div>
                      </div>
                    )}
                    <MarkdownContent text={msg.content} citations={msg.citations || []} onCiteClick={() => onNavigate('kb-documents', { selectedKBId: 'kb-001' })} />
                    {msg.is_streaming && <span className="inline-block w-1 h-4 bg-blue-600 animate-pulse ml-0.5 align-middle rounded-sm" />}
                    {chatSettings.showCitations && !msg.is_streaming && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-500 font-medium mb-2">引用来源 ({msg.citations.length})</p>
                        <div className="space-y-1.5">
                          {msg.citations.map(c => (
                            <div key={c.index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-[10px] hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                              <span className="w-4 h-4 bg-blue-600 text-white rounded flex items-center justify-center font-bold flex-shrink-0">{c.index}</span>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 dark:text-gray-200">{c.doc_name} · P{c.page_number}</div>
                                <div className="text-gray-500 truncate">{c.section}</div>
                              </div>
                              <span className="text-blue-600 ml-auto flex-shrink-0">{(c.relevance_score * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatSettings.showTrace && !msg.is_streaming && (
                      <>
                        <button type="button" onClick={() => setExpandedTrace(prev => { const n = new Set(prev); n.has(msg.id) ? n.delete(msg.id) : n.add(msg.id); return n; })} className="mt-2 text-[10px] text-gray-500 hover:text-blue-600 flex items-center gap-1">
                          <ChevronDown size={12} className={`transition-transform ${expandedTrace.has(msg.id) ? 'rotate-180' : ''}`} /> 查询链路 Trace
                        </button>
                        <QueryTraceTimeline expanded={expandedTrace.has(msg.id)} onViewFull={() => onNavigate('sys-traces')} />
                      </>
                    )}
                    {!msg.is_streaming && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {msg.confidence != null && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${msg.confidence >= 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              {(msg.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                          {msg.latency_ms && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={9} />{(msg.latency_ms / 1000).toFixed(1)}s</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => { setFeedbackMsg(msg.id); setFeedbackType('up'); showToast('感谢反馈'); }} className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600"><ThumbsUp size={12} /></button>
                          <button type="button" onClick={() => { setFeedbackMsg(msg.id); setFeedbackType('down'); }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><ThumbsDown size={12} /></button>
                          <button type="button" onClick={() => setFeedbackMsg(msg.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="纠错"><Edit3 size={12} /></button>
                          <button type="button" onClick={() => copyMessage(msg.content)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Copy size={12} /></button>
                          <button type="button" onClick={regenerateLast} disabled={isStreaming} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-40" title="重新生成"><RefreshCw size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[10px] font-bold text-white">李</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 0 && !isStreaming && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-[10px] text-gray-500 mb-1.5">💡 您可能还想问：</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.slice(0, 3).map((s, i) => (
                <button key={i} type="button" onClick={() => sendMessage(s.text)} className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800">{s.text}</button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end gap-2">
            <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0" title="附件（原型）"><Paperclip size={18} /></button>
            <div className="flex-1 flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-500">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none max-h-32"
              />
              {isStreaming ? (
                <button type="button" onClick={stopStream} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex-shrink-0" title="停止生成"><Square size={14} fill="currentColor" /></button>
              ) : (
                <button type="button" onClick={() => sendMessage()} disabled={!input.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 flex-shrink-0"><Send size={16} /></button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">RAG 3.0 可能会出错，请核实关键信息 · {chatSettings.llmModel}</p>
        </div>
      </div>

      {/* 查询增强面板 */}
      {showPanel && (
        <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto flex-shrink-0 hidden lg:flex">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Layers size={14} /> 查询增强</h3>
            <button type="button" onClick={() => setShowPanel(false)} className="text-gray-400"><X size={13} /></button>
          </div>
          <div className="p-4 space-y-4 text-xs">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">查询重写</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-gray-600 dark:text-gray-400">
                <div><span className="text-gray-400">原始：</span>"违约金怎么赔"</div>
                <div className="text-green-700 dark:text-green-400">→ 精确：供应商合同违约金计算规则</div>
                <div className="text-blue-700 dark:text-blue-400">→ 泛化：违约责任有哪些类型</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">检索通道</h4>
              {[
                { label: 'PageIndex', ms: 520, hit: '供应商合同V5 P3 ⭐1.0' },
                { label: '向量检索', ms: 45, hit: '供应商合同V5 P3 ⭐0.956' },
                { label: 'BM25', ms: 12, hit: '采购协议 P8' },
              ].map(ch => (
                <div key={ch.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                  <div className="flex justify-between font-medium"><span>{ch.label}</span><span className="text-gray-500">{ch.ms}ms</span></div>
                  <div className="text-[10px] text-gray-500 mt-1">{ch.hit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ChatSettingsPanel
        open={showSettings}
        settings={chatSettings}
        onChange={setChatSettings}
        onClose={() => setShowSettings(false)}
        onSave={() => showToast('对话设置已保存')}
      />

      {/* 纠错/差评 */}
      {feedbackMsg && feedbackType === 'down' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">反馈与纠错</h3>
            <p className="text-xs text-gray-500 mb-3">请描述答案问题或提供正确信息，将用于改进检索。</p>
            <textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} rows={4} placeholder="例如：违约金应为千分之三而非千分之五…" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 resize-none" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setFeedbackMsg(null); setFeedbackType(null); setCorrectionText(''); }} className="px-3 py-1.5 text-sm border rounded-lg">取消</button>
              <button type="button" onClick={() => { showToast('纠错已提交'); setFeedbackMsg(null); setFeedbackType(null); setCorrectionText(''); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

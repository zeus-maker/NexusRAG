import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Send, ThumbsUp, ThumbsDown, Edit3, ChevronRight,
  ChevronDown, BookOpen, Layers, Zap, Copy, RefreshCw, X,
  MessageSquare, Clock, Trash2, Pin, Info
} from 'lucide-react';
import { mockConversations, mockKBs } from '../mockData';
import type { ChatMessage, Citation } from '../types';

const SAMPLE_RESPONSES = [
  {
    question: '供应商延迟交货的违约金如何计算？',
    content: `根据公司**标准采购合同模板（V5）第五条**的违约责任条款，供应商迟延交货的违约金计算规则如下：

**1. 基本违约金**
供应商迟延交货的，每迟延一日应按迟延交付货物**价值的千分之五（0.5%）**[1]向采购方支付违约金。

**2. 解除合同权利**
迟延超过 **30 日**的，采购方有权解除合同[2]，并要求供应商赔偿因此造成的全部损失。

**3. 违约金上限**
累计违约金不超过合同标的总金额的 **20%**[1]，超过部分可通过诉讼途径主张实际损失赔偿。

**4. 不可抗力例外**
因不可抗力导致的延迟不适用上述违约金条款，但供应商需在 48 小时内书面通知采购方[3]。`,
    citations: [
      { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.1', snippet: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金，累计不超过合同总额20%。', relevance_score: 0.956 },
      { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 3, section: '第五条 违约责任 §5.2', snippet: '迟延超过三十日的，采购方有权解除合同并要求赔偿全部实际损失。', relevance_score: 0.932 },
      { index: 3, doc_name: '供应商合同模板V5.pdf', page_number: 5, section: '第七条 不可抗力', snippet: '因不可抗力导致无法履约的，受影响方应在48小时内以书面形式通知对方。', relevance_score: 0.878 },
    ],
    confidence: 0.92,
    tier: 'Tier 2',
    channels: ['PageIndex', '向量检索'],
    latency: 2100,
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
- 信息系从第三方合法获取，且该第三方无保密义务[2]
- 法律法规或政府命令要求披露的信息[2]

**保密范围**
包括但不限于：技术方案、商业计划、客户名单、定价策略及本合同条款本身[1]。`,
    citations: [
      { index: 1, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 保密义务 §8.2', snippet: '保密期限为合同履行期间及合同终止或解除后5年。', relevance_score: 0.978 },
      { index: 2, doc_name: '供应商合同模板V5.pdf', page_number: 8, section: '第八条 保密义务 §8.3', snippet: '以下情形不适用保密义务：已成公众知识、合法从第三方获取、法律强制要求披露。', relevance_score: 0.941 },
    ],
    confidence: 0.95,
    tier: 'Tier 1',
    channels: ['向量检索'],
    latency: 850,
  },
];

function formatCitationText(content: string, citations: Citation[]) {
  const parts: Array<{ type: 'text' | 'cite'; value: string; cite?: Citation }> = [];
  let remaining = content;
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    const citeIdx = parseInt(match[1]);
    const cite = citations.find(c => c.index === citeIdx);
    parts.push({ type: 'cite', value: match[0], cite });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return parts;
}

function MarkdownContent({ text, citations }: { text: string; citations: Citation[] }) {
  const [activeCite, setActiveCite] = useState<Citation | null>(null);

  const renderLine = (line: string, citations: Citation[], key: number) => {
    if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
      return <strong key={key} className="block font-semibold text-gray-900 mt-3 mb-1">{line.slice(2, -2)}</strong>;
    }

    const parts = formatCitationText(line, citations);
    const elements = parts.map((p, i) => {
      if (p.type === 'cite' && p.cite) {
        return (
          <button
            key={i}
            onClick={() => setActiveCite(activeCite?.index === p.cite!.index ? null : p.cite!)}
            className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded mx-0.5 hover:bg-blue-700 transition-colors align-middle"
          >
            {p.cite.index}
          </button>
        );
      }
      return <span key={i}>{p.value}</span>;
    });

    // Bold inline
    const rendered = elements.map((el, i) => {
      if (typeof el === 'object' && (el as any)?.type === 'span') {
        const text = (el as any).props.children as string;
        if (typeof text === 'string' && text.includes('**')) {
          const parts2 = text.split('**');
          return <span key={i}>{parts2.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : <span key={j}>{p}</span>)}</span>;
        }
      }
      return el;
    });

    return <span key={key}>{rendered}</span>;
  };

  const lines = text.split('\n');

  return (
    <div className="text-sm text-gray-800 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-2 mb-1">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-2 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-900 mt-3 mb-0.5">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700">{renderLine(line.slice(2), citations, i)}</li>;
        if (line === '') return <br key={i} />;
        return <p key={i} className="mb-0.5">{renderLine(line, citations, i)}</p>;
      })}

      {activeCite && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded">{activeCite.index}</span>
                <span className="text-xs font-semibold text-blue-800">{activeCite.doc_name}</span>
                <span className="text-[10px] text-blue-600">第 {activeCite.page_number} 页</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed mb-1.5">{activeCite.section}</p>
              <p className="text-xs text-gray-600 italic bg-white/60 rounded p-2 leading-relaxed">"{activeCite.snippet}"</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${activeCite.relevance_score * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-blue-700 font-medium">{(activeCite.relevance_score * 100).toFixed(1)}%</span>
                <button className="text-[10px] text-blue-600 hover:underline ml-1">查看原文</button>
              </div>
            </div>
            <button onClick={() => setActiveCite(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChatPageProps {
  convId: string | null;
  onNavigate: (page: string, extra?: any) => void;
}

export function ChatPage({ convId, onNavigate }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedKBs, setSelectedKBs] = useState(['kb-001']);
  const [showPanel, setShowPanel] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [currentConv, setCurrentConv] = useState(convId);
  const [showKBPicker, setShowKBPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string = input) => {
    if (!text.trim() || isStreaming) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const sample = SAMPLE_RESPONSES[messages.length % 2] || SAMPLE_RESPONSES[0];
    const aiMsgId = (Date.now() + 1).toString();
    const streamingMsg: ChatMessage = {
      id: aiMsgId, role: 'assistant', content: '', citations: [], confidence: 0, is_streaming: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, streamingMsg]);
    setIsStreaming(true);

    const fullContent = sample.content;
    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += Math.floor(Math.random() * 6) + 2;
      if (charIndex >= fullContent.length) {
        charIndex = fullContent.length;
        clearInterval(interval);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, content: fullContent, citations: sample.citations, confidence: sample.confidence,
          confidence_level: 'high', routing_tier: sample.tier, channels: sample.channels,
          latency_ms: sample.latency, is_streaming: false,
        } : m));
        setIsStreaming(false);
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent.slice(0, charIndex), is_streaming: true } : m));
      }
    }, 30);
  };

  const selectedKBNames = selectedKBs.map(id => mockKBs.find(k => k.kb_id === id)?.name).filter(Boolean);

  const suggestions = [
    '供应商违约金上限是多少？',
    '采购合同的保密条款包含哪些？',
    '合同解除需要满足哪些条件？',
    '知识产权如何归属？',
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={() => { setMessages([]); setCurrentConv(null); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} /> 新对话
          </button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="搜索对话..." className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 pb-1">
            <p className="text-[10px] text-gray-400 font-medium px-2 py-1">今天</p>
            {mockConversations.slice(0, 2).map(conv => (
              <button
                key={conv.conv_id}
                onClick={() => { setCurrentConv(conv.conv_id); setMessages([]); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors mb-0.5 group ${currentConv === conv.conv_id ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <Pin size={10} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{conv.title}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{conv.last_message}</p>
                  </div>
                </div>
              </button>
            ))}
            <p className="text-[10px] text-gray-400 font-medium px-2 py-1 mt-2">昨天</p>
            {mockConversations.slice(2, 4).map(conv => (
              <button
                key={conv.conv_id}
                onClick={() => { setCurrentConv(conv.conv_id); setMessages([]); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors mb-0.5 ${currentConv === conv.conv_id ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                <p className="text-xs text-gray-700 truncate">{conv.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{conv.last_message}</p>
              </button>
            ))}
            <p className="text-[10px] text-gray-400 font-medium px-2 py-1 mt-2">更早</p>
            {mockConversations.slice(4).map(conv => (
              <button key={conv.conv_id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 mb-0.5">
                <p className="text-xs text-gray-700 truncate">{conv.title}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowPanel(p => !p)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${showPanel ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Layers size={13} /> 查询增强面板
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* KB selector bar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 flex-shrink-0">知识库：</span>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowKBPicker(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 hover:bg-blue-100"
            >
              <BookOpen size={11} />
              {selectedKBNames.join('、') || '选择知识库'}
              <ChevronDown size={11} />
            </button>
            {showKBPicker && (
              <div className="absolute top-8 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">选择知识库</p>
                </div>
                {mockKBs.map(kb => (
                  <button
                    key={kb.kb_id}
                    onClick={() => {
                      setSelectedKBs(prev =>
                        prev.includes(kb.kb_id) ? prev.filter(id => id !== kb.kb_id) : [...prev, kb.kb_id]
                      );
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedKBs.includes(kb.kb_id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selectedKBs.includes(kb.kb_id) && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                    </div>
                    <span className="text-sm">{kb.icon}</span>
                    <span className="text-xs text-gray-700 truncate">{kb.name}</span>
                  </button>
                ))}
                <div className="p-2 border-t border-gray-100">
                  <button onClick={() => setShowKBPicker(false)} className="w-full text-xs text-center text-blue-600 hover:underline">确认</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1"></div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
              <Trash2 size={12} /> 清除对话
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Zap size={24} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">RAG 3.0 智能问答</h2>
                <p className="text-sm text-gray-500 mt-1">基于 {selectedKBNames.join('、') || '知识库'} 为您解答问题</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span>{s}</span>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap size={13} className="text-white" />
                </div>
              )}

              <div className={`max-w-2xl ${msg.role === 'user' ? 'w-auto' : 'flex-1'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed inline-block">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    {/* Routing info */}
                    {msg.routing_tier && !msg.is_streaming && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">{msg.routing_tier}</span>
                        {msg.channels?.map(c => (
                          <span key={c} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">{c}</span>
                        ))}
                      </div>
                    )}

                    <MarkdownContent text={msg.content} citations={msg.citations || []} />

                    {msg.is_streaming && (
                      <span className="inline-block w-1 h-4 bg-blue-600 animate-pulse ml-0.5 align-middle rounded-sm"></span>
                    )}

                    {/* Citations list */}
                    {!msg.is_streaming && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] text-gray-500 font-medium mb-2">引用来源</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map(c => (
                            <div key={c.index} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-600 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                              <span className="w-3.5 h-3.5 bg-blue-100 text-blue-700 rounded flex items-center justify-center font-bold text-[8px]">{c.index}</span>
                              <span className="truncate max-w-28">{c.doc_name}</span>
                              <span className="text-gray-400">P{c.page_number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence & actions */}
                    {!msg.is_streaming && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {msg.confidence !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${(msg.confidence || 0) >= 0.8 ? 'bg-green-500' : (msg.confidence || 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                              <span className="text-[10px] text-gray-500">置信度 {((msg.confidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                          )}
                          {msg.latency_ms && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={9} /> {(msg.latency_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowFeedback(msg.id)} className={`p-1 rounded hover:bg-green-50 transition-colors ${showFeedback === msg.id ? 'text-green-600' : 'text-gray-400'}`}>
                            <ThumbsUp size={12} />
                          </button>
                          <button className="p-1 rounded hover:bg-red-50 text-gray-400 transition-colors">
                            <ThumbsDown size={12} />
                          </button>
                          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                            <Edit3 size={12} />
                          </button>
                          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[10px] font-bold text-white">李</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length > 0 && !isStreaming && (
          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <p className="text-[10px] text-gray-500 mb-1.5">💡 您可能还想问：</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.slice(0, 3).map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-100">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isStreaming ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">RAG 3.0 可能会出错，请核实关键信息</p>
        </div>
      </div>

      {/* Query enhance panel */}
      {showPanel && (
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 hidden lg:flex">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Layers size={14} /> 查询增强</h3>
            <button onClick={() => setShowPanel(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={13} /></button>
          </div>

          <div className="p-4 space-y-4">
            {/* Query rewrite */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">📝 查询重写</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs text-gray-600">
                <div><span className="text-gray-400">原始：</span>"那个违约的事情怎么赔"</div>
                <div className="text-green-700">→ 精确：供应商合同违约金计算规则</div>
                <div className="text-blue-700">→ 泛化：供应商违约责任有哪些类型</div>
                <div className="text-purple-700">→ 跨文档：对比不同合同违约金标准</div>
              </div>
            </div>

            {/* Classifier */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">🏷️ 分类器路由</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: '复杂度', value: 'Tier 2', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: '文档类型', value: '合同/PDF', color: 'bg-gray-50 text-gray-700 border-gray-200' },
                  { label: '用户意图', value: '精确答案', color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: '安全分级', value: '内部', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                ].map(tag => (
                  <div key={tag.label} className={`px-2 py-1.5 border rounded-lg ${tag.color}`}>
                    <div className="text-[9px] opacity-70">{tag.label}</div>
                    <div className="text-xs font-semibold">{tag.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">🔀 检索通道</h4>
              <div className="space-y-2">
                {[
                  { label: 'PageIndex (主)', latency: 520, docs: ['供应商合同V5 P3 ⭐1.0', '采购协议 P8 ⭐0.95'], color: 'bg-blue-500' },
                  { label: '向量检索 (辅)', latency: 45, docs: ['供应商合同V5 P3 ⭐0.956', '采购协议 P8 ⭐0.867'], color: 'bg-purple-500' },
                ].map(ch => (
                  <div key={ch.label} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700">{ch.label}</span>
                      <span className="text-[10px] text-gray-500">{ch.latency}ms</span>
                    </div>
                    {ch.docs.map((d, i) => (
                      <div key={i} className="text-[10px] text-gray-600 flex items-center gap-1 mb-0.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>{d}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="text-[10px] text-gray-500 bg-gray-50 rounded p-2">
                  融合策略：<strong className="text-gray-700">RRF加权</strong> → Top-5精排(Cross-Encoder)
                </div>
              </div>
            </div>

            {/* Knowledge sources */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">📎 知识来源</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: '合同V5', page: 'P3-5' },
                  { name: '采购条款', page: 'P8' },
                  { name: '物流V2', page: 'P5' },
                ].map(src => (
                  <div key={src.name} className="flex flex-col items-center p-2 bg-gray-50 border border-gray-200 rounded-lg w-16 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <span className="text-base mb-0.5">📄</span>
                    <span className="text-[9px] text-gray-700 text-center font-medium leading-tight">{src.name}</span>
                    <span className="text-[9px] text-gray-400">{src.page}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

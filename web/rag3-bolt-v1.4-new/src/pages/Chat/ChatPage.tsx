import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Copy, ThumbsUp, ThumbsDown, Plus, MessageCircle, Settings, Sparkles, FileText, RotateCcw, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; snippet: string }>;
  timestamp: string;
  feedback?: 'up' | 'down' | null;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
}

const initialSessions: ChatSession[] = [
  { id: '1', title: '合同违约金计算', lastMessage: '违约金标准为千分之五', time: '10分钟前' },
  { id: '2', title: '财报数据查询', lastMessage: 'Q3营收同比增长12%', time: '1小时前' },
  { id: '3', title: '合规政策咨询', lastMessage: '需满足GDPR要求', time: '昨天' },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: '供应商违约金如何计算？',
    timestamp: '14:30',
  },
  {
    id: '2',
    role: 'assistant',
    content: '根据公司标准采购合同模板（V5）第五条违约条款：\n\n供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。迟延超过30日的，采购方有权解除合同。',
    sources: [
      { title: '合同模板V5.pdf', snippet: '第五条 违约责任 - 供应商迟延交货的违约金计算方式...' },
      { title: '采购协议条款.pdf', snippet: '违约金标准定义为合同金额的0.3%-0.5%...' },
    ],
    timestamp: '14:30',
  },
];

const botResponses = [
  { content: '根据知识库检索结果，该问题涉及以下关键条款：\n\n1. 违约金计算基数为迟延交付货物的价值\n2. 比例为每日千分之五\n3. 超过30日可解除合同\n\n建议同时参考保密协议中的相关条款以确保完整理解。', sources: [{ title: '合同模板V5.pdf', snippet: '违约责任条款完整描述...' }] },
  { content: '根据财务报告库中的数据：\n\n- Q3 营收同比增长 12.3%\n- 净利润率 18.5%\n- 应收账款周转天数 42 天\n\n详细数据请参考完整财报。', sources: [{ title: 'Q3财务报告.xlsx', snippet: '季度营收及利润数据汇总...' }] },
  { content: '关于合规政策，系统检测到以下相关要求：\n\n1. 数据处理需符合 GDPR 第 6 条合法性基础\n2. 跨境数据传输需确保充分性认定\n3. 用户数据保留期限不得超过 24 个月\n\n建议参考合规政策库获取完整指引。', sources: [{ title: '合规政策总纲.pdf', snippet: '数据处理与跨境传输合规要求...' }] },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSessions, setShowSessions] = useState(true);
  const [activeSession, setActiveSession] = useState('1');
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    setIsTyping(true);

    setTimeout(() => {
      const resp = botResponses[Math.floor(Math.random() * botResponses.length)];
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resp.content,
        sources: resp.sources,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        feedback: null,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m
    ));
  };

  const handleCopy = (msgId: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      lastMessage: '开始新的对话',
      time: '刚刚',
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession.id);
    setMessages([]);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setActiveSession(remaining[0].id);
      }
    }
  };

  return (
    <div className="h-full flex animate-fade-in">
      {/* Sessions Sidebar */}
      {showSessions && (
        <div className="w-64 glass-panel border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <button onClick={handleNewSession} className="neon-button w-full flex items-center justify-center gap-2">
              <Plus size={16} /> 新建对话
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => { setActiveSession(session.id); setMessages(session.id === '1' ? initialMessages : []); }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 relative group ${
                  activeSession === session.id
                    ? 'bg-white/10 border border-neon-cyan/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle size={14} className={activeSession === session.id ? 'text-neon-cyan' : 'text-white/30'} />
                  <span className={`text-sm font-medium truncate flex-1 ${activeSession === session.id ? 'text-white' : 'text-white/60'}`}>
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-0.5 rounded text-white/0 group-hover:text-white/30 hover:!text-red-400/70 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-xs text-white/25 truncate pl-5">{session.lastMessage}</p>
                <p className="text-[10px] text-white/15 pl-5 mt-1">{session.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="glass-panel border-b border-white/5 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSessions(!showSessions)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
              <MessageCircle size={18} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white">智能对话</h1>
              <p className="text-xs text-white/30">RAG 3.0 · 混合检索模式</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="neon-badge-active text-[10px]">
              <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 在线
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot size={40} className="text-neon-cyan/30 mx-auto mb-3" />
                <p className="text-white/40 text-sm">开始新的对话</p>
                <p className="text-white/20 text-xs mt-1">输入您的问题，AI 将基于知识库给出回答</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div className={`max-w-2xl ${msg.role === 'user' ? '' : ''}`}>
                <div className={`rounded-xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-neon-cyan/15'
                    : 'bg-white/[0.03] border border-white/5'
                }`}>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <p className="text-xs text-white/30 flex items-center gap-1">
                        <Sparkles size={12} className="text-neon-cyan/60" /> 引用来源
                      </p>
                      {msg.sources.map((src, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-neon-cyan/15 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText size={12} className="text-neon-cyan/50" />
                            <span className="text-xs text-neon-cyan/70 font-medium">{src.title}</span>
                          </div>
                          <p className="text-xs text-white/40">{src.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex gap-1 items-center mt-1.5 ml-1">
                    <button
                      onClick={() => handleFeedback(msg.id, 'up')}
                      className={`flex items-center gap-1 p-1 rounded text-xs transition-all ${
                        msg.feedback === 'up' ? 'text-neon-cyan' : 'text-white/20 hover:text-neon-cyan/60'
                      }`}
                    >
                      <ThumbsUp size={12} /> 赞
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'down')}
                      className={`flex items-center gap-1 p-1 rounded text-xs transition-all ${
                        msg.feedback === 'down' ? 'text-red-400' : 'text-white/20 hover:text-red-400/60'
                      }`}
                    >
                      <ThumbsDown size={12} /> 踩
                    </button>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className={`flex items-center gap-1 p-1 rounded text-xs transition-all ${
                        copiedId === msg.id ? 'text-neon-cyan' : 'text-white/20 hover:text-white/50'
                      }`}
                    >
                      <Copy size={12} /> {copiedId === msg.id ? '已复制' : '复制'}
                    </button>
                    <button onClick={() => {
                      setMessages(prev => prev.filter(m => m.id !== msg.id));
                      setIsTyping(true);
                      setTimeout(() => {
                        const resp = botResponses[Math.floor(Math.random() * botResponses.length)];
                        const botMsg: Message = {
                          id: (Date.now() + 1).toString(),
                          role: 'assistant',
                          content: resp.content,
                          sources: resp.sources,
                          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                          feedback: null,
                        };
                        setMessages(prev => [...prev, botMsg]);
                        setIsTyping(false);
                      }, 1200 + Math.random() * 800);
                    }} className="flex items-center gap-1 p-1 rounded text-white/20 hover:text-white/50 text-xs transition-colors">
                      <RotateCcw size={12} /> 重试
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white/60" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                <div className="typing-indicator flex items-center gap-0.5">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 px-5 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
              rows={1}
              className="glass-input flex-1 resize-none min-h-[40px] max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
                input.trim() && !isTyping
                  ? 'neon-button-primary'
                  : 'bg-white/5 text-white/15 cursor-not-allowed border border-white/5'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/20">
            <span>混合检索</span>
            <span>·</span>
            <span>BGE-M3</span>
            <span>·</span>
            <span>GPT-4o</span>
            <span>·</span>
            <span>Temperature 0.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Send,
  User,
  Sparkles,
  FileText,
  TrendingUp,
  TrendingDown,
  Database,
  Layers,
  Cpu,
  Network,
  Zap,
  ChevronRight,
  Activity,
  GitBranch,
  CircleDot,
  Filter,
  ArrowRight,
  Boxes,
  Plug,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Lock,
  ScrollText,
  Coins,
  Gauge,
  Wand2,
  PlayCircle,
  Bell,
  CheckCircle2,
  Clock,
  KeyRound,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matrix Engine · 企业级 RAG 3.0 知识库控制台" },
      {
        name: "description",
        content:
          "企业级 RAG 3.0 知识库控制台：管理知识库与文档流水线、调试智能问答、监控检索与生成性能指标。",
      },
      { property: "og:title", content: "Matrix Engine · 企业级 RAG 3.0 知识库控制台" },
      {
        property: "og:description",
        content: "知识库管理、智能问答、性能评估一体化控制台。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      <Sidebar />
      <main className="pl-64">
        <TopBar />
        <div id="overview" className="scroll-mt-20"><OverviewSection /></div>
        <div id="knowledge" className="scroll-mt-20"><KnowledgeBaseSection /></div>
        <div id="chat" className="scroll-mt-20"><ChatSection /></div>
        <div id="retrieval" className="scroll-mt-20"><RetrievalTraceSection /></div>
        <div id="embedding" className="scroll-mt-20"><EmbeddingSpaceSection /></div>
        <div id="evaluation" className="scroll-mt-20"><EvaluationSection /></div>
        <div id="models" className="scroll-mt-20"><ModelConnectorSection /></div>
        <div id="prompts" className="scroll-mt-20"><PromptTemplateSection /></div>
        <div id="cost" className="scroll-mt-20"><CostUsageSection /></div>
        <div id="security" className="scroll-mt-20"><SecurityAuditSection /></div>
        <div id="incidents" className="scroll-mt-20"><IncidentTimelineSection /></div>
        <StatusFooter />
      </main>
    </div>
  );
}

const NAV_SECTIONS: { label: string; items: { icon: typeof FolderKanban; name: string; id: string; badge?: string }[] }[] = [
  {
    label: "核心控制台",
    items: [
      { icon: Activity, name: "系统总览", id: "overview" },
      { icon: FolderKanban, name: "知识库管理", id: "knowledge" },
      { icon: MessageSquare, name: "智能问答", id: "chat", badge: "新" },
      { icon: GitBranch, name: "检索追踪", id: "retrieval" },
      { icon: Boxes, name: "向量空间", id: "embedding" },
      { icon: BarChart3, name: "性能评估", id: "evaluation" },
    ],
  },
  {
    label: "编排与运营",
    items: [
      { icon: Plug, name: "模型与连接器", id: "models" },
      { icon: Wand2, name: "提示词模板", id: "prompts" },
      { icon: Coins, name: "成本与配额", id: "cost" },
    ],
  },
  {
    label: "安全与运维",
    items: [
      { icon: ShieldCheck, name: "权限与审计", id: "security" },
      { icon: Bell, name: "事件时间线", id: "incidents" },
      { icon: Settings, name: "系统管理", id: "system" },
    ],
  },
];

function Sidebar() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const ids = NAV_SECTIONS.flatMap((g) => g.items.map((i) => i.id)).filter(
      (id) => typeof document !== "undefined" && document.getElementById(id),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  };

  return (
    <nav className="fixed inset-y-0 left-0 w-64 border-r border-brand-border bg-brand-bg flex flex-col z-10">
      <div className="p-6 flex items-center gap-3 border-b border-brand-border">
        <div className="size-7 rounded-md grid place-items-center bg-brand-accent/15 ring-1 ring-brand-accent/30">
          <Sparkles className="size-4 text-brand-accent" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">Matrix Engine</span>
          <span className="text-[10px] text-brand-muted font-mono">RAG · v3.0</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
        {NAV_SECTIONS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="text-[10px] font-medium text-brand-muted uppercase tracking-widest px-2 mb-2">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <a
                  key={item.name}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-brand-surface text-brand-text ring-1 ring-white/5"
                      : "text-brand-muted hover:text-brand-text hover:bg-brand-surface/50"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${isActive ? "text-brand-accent" : ""}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/30">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-brand-border">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-full bg-zinc-800 grid place-items-center ring-1 ring-white/10">
            <User className="size-4 text-brand-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">管理员账号</p>
            <p className="text-[10px] text-brand-muted truncate font-mono">enterprise · admin</p>
          </div>
          <div className="size-2 rounded-full bg-brand-accent shadow-[0_0_8px_oklch(0.74_0.16_162_/_0.7)]" />
        </div>
      </div>
    </nav>
  );
}

function TopBar() {
  return (
    <div className="sticky top-0 z-[5] flex items-center justify-between px-10 py-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs text-brand-muted">
        <span>控制台</span>
        <span className="text-brand-border">/</span>
        <span className="text-brand-text">知识库管理</span>
        <span className="text-brand-border">/</span>
        <span className="text-brand-text">技术文档存储</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            placeholder="搜索文档、知识库、对话…"
            className="w-72 bg-brand-surface text-xs pl-9 pr-12 py-2 rounded-md border border-brand-border placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-accent/40"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-brand-muted font-mono px-1.5 py-0.5 rounded border border-brand-border bg-brand-bg">
            ⌘K
          </kbd>
        </div>
        <div className="text-[10px] font-mono text-brand-muted tabular-nums">
          <span className="text-brand-accent">●</span> 集群健康 · p95 1.24s
        </div>
      </div>
    </div>
  );
}

function KnowledgeBaseSection() {
  const stats = [
    { label: "文档总数", value: "1,248", hint: "今日新增 24" },
    { label: "切片数量", value: "48.2k", hint: "平均 512 token" },
    { label: "向量维度", value: "1,536", hint: "text-embedding-3" },
    { label: "最近索引", value: "14:20", hint: "11 分钟前" },
  ];

  const docs = [
    { name: "API_Reference_v3.pdf", size: "2.4 MB", chunks: "1,024", status: "已索引", tone: "success" },
    { name: "Q4_Technical_Report.docx", size: "1.1 MB", chunks: "458", status: "向量化中", tone: "info" },
    { name: "部署手册_v2.md", size: "320 KB", chunks: "128", status: "已索引", tone: "success" },
    { name: "Architecture_Map.png", size: "5.8 MB", chunks: "0", status: "解析失败", tone: "error" },
    { name: "安全合规白皮书.pdf", size: "3.7 MB", chunks: "612", status: "已索引", tone: "success" },
  ] as const;

  return (
    <section className="p-10 border-b border-brand-border">
      <div className="flex justify-between items-end mb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted uppercase tracking-widest">
            <span>KB_ID · 992-012</span>
            <span className="text-brand-border">/</span>
            <span className="text-brand-accent">ACTIVE</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">知识库：技术文档存储</h1>
          <p className="text-sm text-brand-muted max-w-[60ch]">
            管理非结构化数据源，监控文档分块、向量化及索引管道状态。支持 PDF、Word、Markdown 等 20+ 文件类型。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs font-medium px-3 py-2 rounded-md border border-brand-border text-brand-muted hover:text-brand-text hover:border-zinc-600 transition-colors">
            重建索引
          </button>
          <button className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-950 text-sm font-medium py-2 px-3 rounded-md hover:bg-white transition-colors">
            <Plus className="size-3.5" /> 上传新文档
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-lg border border-brand-border bg-brand-surface">
            <p className="text-[11px] text-brand-muted">{s.label}</p>
            <p className="text-2xl font-mono mt-1 tabular-nums">{s.value}</p>
            <p className="text-[10px] text-brand-muted mt-1 font-mono">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">文档列表</span>
            <span className="text-[10px] text-brand-muted font-mono">5 / 1,248</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-brand-muted">
            <span className="px-2 py-0.5 rounded border border-brand-border bg-brand-bg">全部状态</span>
            <span className="px-2 py-0.5 rounded border border-brand-border bg-brand-bg">按时间排序</span>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-900/40 border-b border-brand-border text-[11px] uppercase tracking-wider">
              <th className="px-4 py-2.5 font-medium text-brand-muted">文件名</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">大小</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">分块</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">流水线状态</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {docs.map((d) => (
              <tr key={d.name} className="hover:bg-zinc-900/30 transition-colors group">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-3.5 text-brand-muted shrink-0" />
                    {d.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-muted font-mono text-xs">{d.size}</td>
                <td className="px-4 py-3 text-brand-muted font-mono text-xs tabular-nums">{d.chunks}</td>
                <td className="px-4 py-3"><StatusBadge tone={d.tone} label={d.status} /></td>
                <td className="px-4 py-3 text-right text-xs text-brand-muted">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand-text cursor-pointer">
                    详情 →
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ tone, label }: { tone: "success" | "info" | "error" | "warning"; label: string }) {
  const tones: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    info: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    error: "bg-red-500/10 text-red-400 ring-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ring-1 ${tones[tone]}`}>
      <span className={`size-1.5 rounded-full ${tone === "info" ? "animate-pulse" : ""} bg-current`} />
      {label}
    </span>
  );
}

function ChatSection() {
  return (
    <section className="p-10 border-b border-brand-border bg-zinc-900/20">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-brand-border" />
          <span className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.2em]">
            RAG Session · #ses_8f2k
          </span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="size-8 rounded-md bg-zinc-800 border border-brand-border shrink-0 grid place-items-center text-[10px] text-brand-muted">
              YOU
            </div>
            <div className="text-sm pt-1.5 text-brand-text">
              如何配置高可用集群的负载均衡器？请结合 Keepalived 给出具体配置示例。
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-8 rounded-md bg-brand-accent shrink-0 grid place-items-center text-brand-bg">
              <Sparkles className="size-4" />
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
                <span className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20">
                  技术查询
                </span>
                <span>已分类 · 召回 2 个切片 · 耦合度 0.91</span>
              </div>
              <p className="text-sm leading-relaxed text-pretty">
                配置高可用集群的负载均衡器需要遵循以下三个核心步骤。根据知识库中的《系统架构指南》，您需要首先初始化心跳检测机制，确保主备节点间的状态同步。
              </p>
              <p className="text-sm leading-relaxed text-pretty">
                典型的 Keepalived 配置示例 <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-brand-accent">vrrp_instance VI_1</span> 应在主节点设置 <span className="font-mono text-xs">priority 150</span>，备节点 <span className="font-mono text-xs">priority 100</span>，避免脑裂。
                <span className="inline-block ml-1 w-1.5 h-3.5 bg-brand-accent align-middle animate-pulse" />
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <CitationCard title="系统架构指南.pdf" snippet="在高可用性环境中，L4 负载均衡器应配合 Keepalived 共同实现 IP 漂移与故障转移..." score="0.94" page="P. 42" />
                <CitationCard title="部署手册_v3.docx" snippet="确保配置文件中的 priority 参数在主备节点上具有明显差异以防止脑裂..." score="0.88" page="P. 17" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group pt-4">
          <div className="absolute -top-1 left-0 flex gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-brand-border">
              知识库: 技术文档
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
              模型: Claude 3.7
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-brand-border">
              Top-K: 5
            </span>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-bg p-1 shadow-2xl ring-1 ring-white/5 mt-6">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm p-3 min-h-[88px] placeholder:text-zinc-600 resize-none"
              placeholder="输入查询指令… 使用 / 调用快捷命令"
            />
            <div className="flex justify-between items-center px-2 py-2 border-t border-brand-border">
              <div className="flex items-center gap-2 text-[10px] text-brand-muted font-mono">
                <kbd className="px-1.5 py-0.5 rounded border border-brand-border bg-brand-surface">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-brand-border bg-brand-surface">↵</kbd>
                <span>发送</span>
              </div>
              <button className="inline-flex items-center gap-1.5 bg-brand-accent text-brand-bg text-sm font-medium py-1.5 px-3 rounded">
                发送 <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CitationCard({ title, snippet, score, page }: { title: string; snippet: string; score: string; page: string }) {
  return (
    <div className="p-3 rounded border border-brand-border bg-brand-surface space-y-2 hover:border-zinc-600 transition-colors cursor-pointer group">
      <div className="flex justify-between items-center gap-2">
        <span className="text-[10px] font-medium text-brand-text truncate">{title}</span>
        <span className="text-[10px] text-brand-accent font-mono shrink-0">{score}</span>
      </div>
      <p className="text-[11px] text-brand-muted leading-snug line-clamp-2 italic">"{snippet}"</p>
      <div className="flex items-center justify-between pt-1 border-t border-brand-border/50">
        <span className="text-[9px] text-brand-muted font-mono uppercase tracking-wider">{page}</span>
        <span className="text-[10px] text-brand-muted group-hover:text-brand-text transition-colors">查看 →</span>
      </div>
    </div>
  );
}

function EvaluationSection() {
  const metrics = [
    { label: "召回率 @K=5", value: "92.4%", pct: 92.4, trend: "+1.2%", trendUp: true, tone: "emerald" },
    { label: "平均精准度 (MAP)", value: "88.1%", pct: 88.1, trend: "+0.4%", trendUp: true, tone: "emerald" },
    { label: "延迟 (P95)", value: "1.24s", pct: 65, trend: "+4%", trendUp: false, tone: "zinc" },
    { label: "首字符生成", value: "340ms", pct: 80, trend: "-12ms", trendUp: true, tone: "zinc" },
  ] as const;

  const bars = [62, 68, 55, 78, 82, 70, 88, 92, 85, 90, 95, 98];
  const precisionBars = [50, 55, 48, 60, 65, 58, 70, 75, 72, 78, 80, 82];

  const runs = [
    { id: "#RUN-0422", name: "全量回归测试", time: "2026-06-04 09:12", status: "通过", recall: "92.4%" },
    { id: "#RUN-0421", name: "生产环境金丝雀", time: "2026-06-03 18:45", status: "通过", recall: "91.8%" },
    { id: "#RUN-0420", name: "Embedding 切换 A/B", time: "2026-06-03 11:02", status: "退化", recall: "87.3%" },
  ];

  return (
    <section className="p-10">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">性能评估指标</h2>
          <p className="text-sm text-brand-muted">检索质量、生成延迟与系统健康度，每 5 秒自动刷新。</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
          <span className="size-1.5 rounded-full bg-brand-accent animate-pulse" />
          AUTO-REFRESH · 5s
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="p-4 rounded-lg border border-brand-border bg-brand-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-muted font-medium">{m.label}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${
                  m.trendUp ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {m.trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {m.trend}
              </span>
            </div>
            <div className={`text-3xl font-mono tabular-nums ${m.tone === "emerald" ? "text-emerald-400" : "text-zinc-100"}`}>
              {m.value}
            </div>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${m.tone === "emerald" ? "bg-emerald-500" : "bg-zinc-500"}`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-brand-border bg-brand-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium">检索质量趋势</p>
              <p className="text-[10px] text-brand-muted font-mono mt-0.5">过去 12 小时 · 每小时聚合</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-brand-muted">Recall</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-zinc-500" />
                <span className="text-xs text-brand-muted">Precision</span>
              </div>
            </div>
          </div>
          <div className="h-48 w-full bg-zinc-900/40 rounded flex items-end justify-between px-4 pb-3 gap-1.5 border border-brand-border/50">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex items-end gap-1 h-full">
                <div className="flex-1 bg-emerald-500/60 rounded-t-sm" style={{ height: `${h}%` }} />
                <div className="flex-1 bg-zinc-600/70 rounded-t-sm" style={{ height: `${precisionBars[i]}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-brand-muted font-mono">
            <span>03:00</span>
            <span>09:00</span>
            <span>15:00</span>
            <span>NOW</span>
          </div>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-4">
          <div>
            <p className="text-sm font-medium">最近测评任务</p>
            <p className="text-[10px] text-brand-muted font-mono mt-0.5">最近 7 天 · 共 24 次</p>
          </div>
          <div className="space-y-3">
            {runs.map((r) => (
              <div key={r.id} className="pb-3 border-b border-brand-border last:border-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{r.id}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ring-1 ${
                      r.status === "通过"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted">{r.name}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-brand-muted">
                  <span>{r.time}</span>
                  <span className="text-brand-text">Recall {r.recall}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewSection() {
  const pipeline = [
    { icon: FileText, label: "数据接入", value: "1,248", unit: "docs", sub: "PDF · DOCX · MD", tone: "zinc" },
    { icon: Layers, label: "分块切片", value: "48.2k", unit: "chunks", sub: "512 token avg", tone: "zinc" },
    { icon: Cpu, label: "向量化", value: "1,536", unit: "dim", sub: "text-embedding-3", tone: "zinc" },
    { icon: Database, label: "向量索引", value: "HNSW", unit: "ef=128", sub: "Qdrant Cluster", tone: "zinc" },
    { icon: Network, label: "混合检索", value: "BM25+ANN", unit: "", sub: "Reranker: bge-v2", tone: "accent" },
    { icon: Sparkles, label: "生成推理", value: "Claude 3.7", unit: "200K ctx", sub: "stream · cited", tone: "accent" },
  ];

  const live = [
    { label: "QPS", value: "12.4" },
    { label: "活跃会话", value: "38" },
    { label: "向量库容量", value: "62%" },
    { label: "Token / min", value: "84.2k" },
  ];

  return (
    <section className="px-10 pt-10 pb-8 border-b border-brand-border bg-[radial-gradient(ellipse_at_top,_oklch(0.74_0.16_162/0.04),transparent_60%)]">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted uppercase tracking-widest">
            <Activity className="size-3 text-brand-accent" />
            <span>系统总览</span>
            <span className="text-brand-border">·</span>
            <span>实时</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">RAG 3.0 检索增强生成管道</h1>
          <p className="text-sm text-brand-muted max-w-[68ch]">
            端到端流水线：从企业知识资产接入，到分块、向量化、混合检索、重排序，再到模型生成回答与引用追溯，全链路可观测。
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {live.map((l) => (
            <div key={l.label} className="text-right">
              <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">{l.label}</div>
              <div className="text-lg font-mono tabular-nums text-brand-text mt-0.5">{l.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface/60 p-5 ring-1 ring-white/[0.02]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <GitBranch className="size-3.5 text-brand-muted" />
            <span className="text-xs font-medium">数据流拓扑</span>
            <span className="text-[10px] font-mono text-brand-muted">pipeline_v3.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CircleDot className="size-3 animate-pulse" />
            ALL SYSTEMS NOMINAL
          </div>
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {pipeline.map((p, i) => {
            const Icon = p.icon;
            const isAccent = p.tone === "accent";
            return (
              <div key={p.label} className="flex items-center gap-2 shrink-0">
                <div
                  className={`min-w-[160px] p-3 rounded-lg border ${
                    isAccent
                      ? "border-brand-accent/30 bg-brand-accent/[0.04]"
                      : "border-brand-border bg-brand-bg/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`size-3.5 ${isAccent ? "text-brand-accent" : "text-brand-muted"}`} />
                    <span className="text-[9px] font-mono text-brand-muted">{`0${i + 1}`}</span>
                  </div>
                  <div className="text-[10px] text-brand-muted font-medium">{p.label}</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className={`text-sm font-mono tabular-nums ${isAccent ? "text-brand-accent" : "text-brand-text"}`}>
                      {p.value}
                    </span>
                    {p.unit && <span className="text-[9px] font-mono text-brand-muted">{p.unit}</span>}
                  </div>
                  <div className="text-[9px] font-mono text-brand-muted mt-1 truncate">{p.sub}</div>
                </div>
                {i < pipeline.length - 1 && (
                  <ChevronRight className="size-3 text-brand-border shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RetrievalTraceSection() {
  const stages = [
    { name: "Query Rewrite", time: "12ms", detail: "扩写为 3 个子查询", count: "3", tone: "zinc" },
    { name: "Embedding", time: "48ms", detail: "text-embedding-3-large", count: "1536d", tone: "zinc" },
    { name: "Hybrid Search", time: "126ms", detail: "BM25 ∪ ANN(ef=128)", count: "20", tone: "accent" },
    { name: "Rerank", time: "84ms", detail: "bge-reranker-v2-m3", count: "5", tone: "accent" },
    { name: "Context Pack", time: "8ms", detail: "去重 · 截断 4K token", count: "3.2k", tone: "zinc" },
    { name: "LLM Generate", time: "962ms", detail: "Claude 3.7 · stream", count: "412t", tone: "accent" },
  ];

  const candidates = [
    { rank: 1, doc: "系统架构指南.pdf · P.42", bm25: 18.4, ann: 0.91, final: 0.94, kept: true },
    { rank: 2, doc: "部署手册_v3.docx · P.17", bm25: 14.2, ann: 0.86, final: 0.88, kept: true },
    { rank: 3, doc: "API_Reference_v3.pdf · P.108", bm25: 11.7, ann: 0.82, final: 0.81, kept: true },
    { rank: 4, doc: "Q4_Technical_Report.docx · P.4", bm25: 9.1, ann: 0.78, final: 0.62, kept: false },
    { rank: 5, doc: "安全合规白皮书.pdf · P.22", bm25: 7.8, ann: 0.74, final: 0.51, kept: false },
  ];

  return (
    <section className="p-10 border-b border-brand-border">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted uppercase tracking-widest">
            <Zap className="size-3 text-brand-accent" />
            <span>TRACE · req_8f2k_a91b</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">检索调试 · 全链路追踪</h2>
          <p className="text-sm text-brand-muted">查看最近一次问答的完整检索链路、各阶段耗时与候选切片重排前后变化。</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs font-medium px-3 py-2 rounded-md border border-brand-border text-brand-muted hover:text-brand-text hover:border-zinc-600 transition-colors inline-flex items-center gap-1.5">
            <Filter className="size-3" /> 切换 Trace
          </button>
          <span className="text-[10px] font-mono text-brand-muted">总耗时 <span className="text-brand-accent">1,240ms</span></span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-6">
        {stages.map((s, i) => {
          const isAccent = s.tone === "accent";
          return (
            <div
              key={s.name}
              className={`p-3 rounded-lg border ${
                isAccent ? "border-brand-accent/25 bg-brand-accent/[0.04]" : "border-brand-border bg-brand-surface"
              } space-y-2`}
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-brand-muted">
                <span>STAGE {i + 1}</span>
                <span>{s.count}</span>
              </div>
              <div className="text-xs font-medium text-brand-text">{s.name}</div>
              <div className={`text-xl font-mono tabular-nums ${isAccent ? "text-brand-accent" : "text-brand-text"}`}>
                {s.time}
              </div>
              <div className="text-[10px] font-mono text-brand-muted leading-tight">{s.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">候选切片重排</span>
            <span className="text-[10px] text-brand-muted font-mono">召回 20 · 重排后保留 3</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
            <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" />已采纳</span>
            <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-zinc-600" />已丢弃</span>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-900/40 border-b border-brand-border text-[11px] uppercase tracking-wider">
              <th className="px-4 py-2.5 font-medium text-brand-muted w-12">#</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">候选切片</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">BM25</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">向量相似度</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted">重排得分</th>
              <th className="px-4 py-2.5 font-medium text-brand-muted text-right">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {candidates.map((c) => (
              <tr key={c.rank} className={`hover:bg-zinc-900/30 transition-colors ${!c.kept ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-brand-muted font-mono text-xs tabular-nums">{c.rank.toString().padStart(2, "0")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-3.5 text-brand-muted shrink-0" />
                    <span className="text-xs">{c.doc}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-brand-muted">{c.bm25.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-brand-muted w-10">{c.ann.toFixed(2)}</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
                      <div className="h-full bg-zinc-500" style={{ width: `${c.ann * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs tabular-nums w-10 ${c.kept ? "text-brand-accent" : "text-brand-muted"}`}>
                      {c.final.toFixed(2)}
                    </span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className={`h-full ${c.kept ? "bg-brand-accent" : "bg-zinc-600"}`}
                        style={{ width: `${c.final * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.kept ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <ArrowRight className="size-3" /> 注入上下文
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-brand-muted">低于阈值 0.70</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusFooter() {
  const items = [
    { label: "BUILD", value: "v3.0.42-prod" },
    { label: "REGION", value: "cn-shanghai-2" },
    { label: "VECTOR DB", value: "Qdrant 1.9.1" },
    { label: "UPTIME", value: "42d 18h" },
  ];
  return (
    <footer className="px-10 py-4 flex items-center justify-between text-[10px] font-mono text-brand-muted border-t border-brand-border bg-brand-surface/40">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_oklch(0.74_0.16_162/0.7)]" />
          OPERATIONAL
        </span>
        {items.map((i) => (
          <span key={i.label}>
            <span className="opacity-60">{i.label}</span> <span className="text-brand-text">{i.value}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span>© 2026 Matrix Engine</span>
        <span className="opacity-60">已通过 SOC2 · ISO27001</span>
      </div>
    </footer>
  );
}

function EmbeddingSpaceSection() {
  // Pre-baked 2D cluster points for a stylized embedding scatter visualization.
  const clusters = [
    {
      name: "技术架构",
      color: "oklch(0.74 0.16 162)",
      docs: 412,
      center: { x: 28, y: 32 },
      points: [
        { x: 22, y: 28, r: 3 },
        { x: 30, y: 30, r: 4 },
        { x: 26, y: 36, r: 3 },
        { x: 34, y: 34, r: 5 },
        { x: 24, y: 40, r: 3 },
        { x: 32, y: 26, r: 4 },
        { x: 36, y: 38, r: 3 },
      ],
    },
    {
      name: "API 文档",
      color: "oklch(0.70 0.18 250)",
      docs: 286,
      center: { x: 68, y: 28 },
      points: [
        { x: 64, y: 24, r: 3 },
        { x: 70, y: 28, r: 5 },
        { x: 74, y: 26, r: 3 },
        { x: 66, y: 34, r: 4 },
        { x: 72, y: 32, r: 3 },
        { x: 62, y: 30, r: 3 },
      ],
    },
    {
      name: "运维手册",
      color: "oklch(0.78 0.15 80)",
      docs: 198,
      center: { x: 42, y: 68 },
      points: [
        { x: 38, y: 62, r: 3 },
        { x: 44, y: 70, r: 5 },
        { x: 48, y: 66, r: 3 },
        { x: 40, y: 74, r: 4 },
        { x: 46, y: 76, r: 3 },
        { x: 36, y: 70, r: 3 },
      ],
    },
    {
      name: "合规白皮书",
      color: "oklch(0.68 0.20 20)",
      docs: 154,
      center: { x: 78, y: 70 },
      points: [
        { x: 74, y: 66, r: 3 },
        { x: 80, y: 72, r: 4 },
        { x: 82, y: 68, r: 3 },
        { x: 76, y: 74, r: 3 },
        { x: 84, y: 76, r: 4 },
      ],
    },
  ];

  const topQueries = [
    { q: "如何配置 HA 集群负载均衡？", hits: 412, recall: 0.94 },
    { q: "embedding 模型切换步骤", hits: 318, recall: 0.91 },
    { q: "权限模型与租户隔离方案", hits: 264, recall: 0.88 },
    { q: "知识库冷启动数据准备", hits: 198, recall: 0.82 },
    { q: "失败重试策略与幂等键", hits: 142, recall: 0.76 },
  ];

  return (
    <section className="p-10 border-b border-brand-border bg-zinc-900/20">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted uppercase tracking-widest">
            <Boxes className="size-3 text-brand-accent" />
            <span>EMBEDDING SPACE · UMAP-2D</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">向量空间分布与热门查询</h2>
          <p className="text-sm text-brand-muted">语义相近的文档在二维投影上自然聚类，可快速发现知识盲区与冗余。</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted">
          <span className="px-2 py-1 rounded border border-brand-border bg-brand-surface">视图: UMAP</span>
          <span className="px-2 py-1 rounded border border-brand-border bg-brand-surface">最近 7 天</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-brand-border bg-brand-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">语义聚类视图</p>
              <p className="text-[10px] text-brand-muted font-mono mt-0.5">4 cluster · 1,050 vectors sampled</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {clusters.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[10px] text-brand-muted font-mono">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] rounded border border-brand-border/60 bg-[linear-gradient(oklch(0.27_0.006_285/0.4)_1px,transparent_1px),linear-gradient(90deg,oklch(0.27_0.006_285/0.4)_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              {clusters.map((c) => (
                <g key={c.name}>
                  <circle
                    cx={c.center.x}
                    cy={c.center.y}
                    r={14}
                    fill={c.color}
                    opacity="0.06"
                  />
                  <circle
                    cx={c.center.x}
                    cy={c.center.y}
                    r={8}
                    fill={c.color}
                    opacity="0.10"
                  />
                  {c.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={p.r * 0.4}
                      fill={c.color}
                      opacity="0.85"
                    />
                  ))}
                </g>
              ))}
              {/* Query point — pulsing */}
              <circle cx="50" cy="50" r="1.2" fill="oklch(0.96 0.003 285)" />
              <circle cx="50" cy="50" r="3" fill="none" stroke="oklch(0.96 0.003 285)" strokeWidth="0.3" opacity="0.6">
                <animate attributeName="r" values="3;7;3" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
              </circle>
            </svg>
            {clusters.map((c) => (
              <div
                key={c.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${c.center.x}%`, top: `${c.center.y - 10}%` }}
              >
                <div className="text-[9px] font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: c.color }}>
                  {c.name}
                </div>
                <div className="text-[9px] font-mono text-brand-muted text-center">{c.docs}</div>
              </div>
            ))}
            <div className="absolute bottom-2 left-3 text-[9px] font-mono text-brand-muted">UMAP-1 →</div>
            <div className="absolute top-2 left-3 text-[9px] font-mono text-brand-muted [writing-mode:vertical-rl] rotate-180">UMAP-2 →</div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-brand-bg/80 border border-brand-border text-[9px] font-mono">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-brand-muted">当前查询投影</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Flame className="size-3.5 text-orange-400" /> 热门查询 Top 5
              </p>
              <p className="text-[10px] text-brand-muted font-mono mt-0.5">按 7 天访问次数排序</p>
            </div>
          </div>
          <div className="space-y-3">
            {topQueries.map((q, i) => (
              <div key={q.q} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-brand-muted shrink-0 mt-0.5">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs text-brand-text truncate">{q.q}</span>
                  </div>
                  <span className="text-[10px] font-mono text-brand-muted shrink-0 tabular-nums">{q.hits}</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${q.recall >= 0.85 ? "bg-emerald-500" : q.recall >= 0.78 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${q.recall * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-brand-muted tabular-nums w-10 text-right">
                    {(q.recall * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModelConnectorSection() {
  const models = [
    { name: "Claude 3.7 Sonnet", role: "主生成模型", ctx: "200K", latency: "962ms", status: "活跃", tone: "success" },
    { name: "GPT-4o", role: "降级备份", ctx: "128K", latency: "—", status: "待命", tone: "info" },
    { name: "text-embedding-3-large", role: "向量化", ctx: "8K", latency: "48ms", status: "活跃", tone: "success" },
    { name: "bge-reranker-v2-m3", role: "重排序", ctx: "—", latency: "84ms", status: "活跃", tone: "success" },
  ];

  const connectors = [
    { name: "Confluence", icon: "C", color: "oklch(0.65 0.18 250)", docs: 412, last: "5 分钟前", status: "已同步" },
    { name: "GitHub Wiki", icon: "G", color: "oklch(0.70 0.02 285)", docs: 286, last: "2 小时前", status: "已同步" },
    { name: "Notion", icon: "N", color: "oklch(0.96 0.003 285)", docs: 198, last: "1 天前", status: "同步中" },
    { name: "S3 Bucket", icon: "S", color: "oklch(0.78 0.15 80)", docs: 352, last: "实时", status: "已同步" },
  ];

  return (
    <section className="p-10 border-b border-brand-border">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted uppercase tracking-widest">
          <Plug className="size-3 text-brand-accent" />
          <span>系统编排</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">模型与数据源编排</h2>
        <p className="text-sm text-brand-muted">统一管理大模型路由策略与企业知识源连接器，支持热切换与降级。</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-brand-border">
            <div className="flex items-center gap-2">
              <Cpu className="size-3.5 text-brand-muted" />
              <span className="text-sm font-medium">模型路由</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1">
              <ShieldCheck className="size-3" /> 多模型容灾
            </span>
          </div>
          <div className="divide-y divide-brand-border/60">
            {models.map((m) => (
              <div key={m.name} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-900/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <span className="text-[9px] font-mono text-brand-muted px-1.5 py-0.5 rounded border border-brand-border">
                      {m.ctx}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-brand-muted mt-0.5">{m.role}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono tabular-nums text-brand-text">{m.latency}</div>
                  <StatusBadge tone={m.tone as "success" | "info" | "error"} label={m.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-brand-border">
            <div className="flex items-center gap-2">
              <Network className="size-3.5 text-brand-muted" />
              <span className="text-sm font-medium">数据源连接器</span>
            </div>
            <button className="text-[10px] font-mono text-brand-accent hover:text-brand-text inline-flex items-center gap-1 transition-colors">
              <Plus className="size-3" /> 新增连接器
            </button>
          </div>
          <div className="divide-y divide-brand-border/60">
            {connectors.map((c) => (
              <div key={c.name} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/30 transition-colors">
                <div
                  className="size-8 rounded-md grid place-items-center text-xs font-bold text-brand-bg shrink-0"
                  style={{ background: c.color }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <span className="text-[9px] font-mono text-brand-muted">{c.docs} docs</span>
                  </div>
                  <div className="text-[10px] font-mono text-brand-muted mt-0.5">
                    最近同步 · {c.last}
                  </div>
                </div>
                <StatusBadge
                  tone={c.status === "已同步" ? "success" : "info"}
                  label={c.status}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.04] flex items-start gap-3">
        <AlertTriangle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-yellow-200">
            Notion 连接器同步速率受限
          </div>
          <p className="text-[11px] text-brand-muted mt-1">
            最近 1 小时检测到 3 次 API 429 错误，建议升级 Notion 集成配额或启用增量同步窗口。
          </p>
        </div>
        <button className="text-[10px] font-mono text-yellow-300 hover:text-yellow-100 shrink-0 px-2 py-1 rounded border border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
          查看详情 →
        </button>
      </div>
    </section>
  );
}

function PromptTemplateSection() {
  const templates = [
    {
      name: "RAG · 标准应答",
      tag: "production",
      tone: "success" as const,
      vars: ["context", "question", "tone"],
      uses: "12.4k",
      updated: "2 天前",
    },
    {
      name: "代码助手 · 仓库感知",
      tag: "production",
      tone: "success" as const,
      vars: ["repo_tree", "file", "diff"],
      uses: "6.2k",
      updated: "4 天前",
    },
    {
      name: "合规问答 · 引用强约束",
      tag: "staging",
      tone: "warning" as const,
      vars: ["policy_chunks", "question"],
      uses: "842",
      updated: "今日",
    },
    {
      name: "多轮工单 · 内部诊断",
      tag: "draft",
      tone: "info" as const,
      vars: ["history", "ticket", "kb"],
      uses: "—",
      updated: "草稿",
    },
  ];

  const promptSample = `你是 Matrix Engine 的企业知识助手。
基于 <context> 中的片段，使用 {{tone}} 的语气回答 {{question}}。
若上下文缺失，回答"未在知识库中检索到"。所有事实必须给出 [doc#chunk] 引用。`;

  return (
    <section id="prompts" className="px-8 py-10 border-t border-brand-border">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-brand-muted uppercase tracking-widest">
            <Wand2 className="size-3.5 text-brand-accent" />
            prompt_orchestration
          </div>
          <h2 className="text-xl font-semibold mt-1.5 tracking-tight">提示词模板编排</h2>
          <p className="text-xs text-brand-muted mt-1">
            版本化管理生成端 Prompt，A/B 实验与回滚一键完成。
          </p>
        </div>
        <button className="text-xs font-medium px-3 py-1.5 rounded-md bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/30 hover:bg-brand-accent/25 transition-colors flex items-center gap-1.5">
          <Plus className="size-3.5" />
          新建模板
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="rounded-xl border border-brand-border bg-brand-surface/40 divide-y divide-brand-border overflow-hidden">
          {templates.map((t, i) => (
            <div
              key={t.name}
              className={`px-4 py-3.5 flex items-center gap-3 hover:bg-brand-surface/70 transition-colors cursor-pointer ${
                i === 0 ? "bg-brand-surface/70" : ""
              }`}
            >
              <div className="size-8 rounded-md bg-brand-bg ring-1 ring-brand-border grid place-items-center shrink-0">
                <Wand2 className="size-4 text-brand-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-brand-text truncate">{t.name}</span>
                  <StatusBadge tone={t.tone} label={t.tag} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-brand-muted">
                  <span>{t.vars.length} 变量</span>
                  <span>·</span>
                  <span>{t.uses} 调用</span>
                  <span>·</span>
                  <span>{t.updated}</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-brand-muted shrink-0" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface/40 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-brand-muted">templates / rag_standard.v12</span>
              <StatusBadge tone="success" label="active" />
            </div>
            <div className="flex items-center gap-1.5">
              <button className="text-[10px] font-mono text-brand-muted hover:text-brand-text px-2 py-1 rounded border border-brand-border">
                Diff v11
              </button>
              <button className="text-[10px] font-mono text-brand-accent hover:text-brand-text px-2 py-1 rounded border border-brand-accent/30 bg-brand-accent/10 flex items-center gap-1">
                <PlayCircle className="size-3" /> 试跑
              </button>
            </div>
          </div>
          <pre className="px-4 py-4 text-xs font-mono text-brand-text/90 leading-relaxed whitespace-pre-wrap flex-1">
{promptSample}
          </pre>
          <div className="px-4 py-2.5 border-t border-brand-border flex items-center gap-3 text-[10px] font-mono text-brand-muted">
            <span>变量:</span>
            {["context", "question", "tone"].map((v) => (
              <span key={v} className="px-1.5 py-0.5 rounded bg-brand-bg ring-1 ring-brand-border text-brand-accent">
                {`{{${v}}}`}
              </span>
            ))}
            <span className="ml-auto">A/B 50/50 · v12 胜出 +6.2%</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CostUsageSection() {
  const items = [
    { label: "本月 Token 用量", value: "184.2M", sub: "↑ 12% vs 上周期", icon: Coins, tone: "text-emerald-400" },
    { label: "推理花费", value: "$2,318.40", sub: "预算消耗 64%", icon: Gauge, tone: "text-brand-accent" },
    { label: "向量存储", value: "412 GB", sub: "余量 38%", icon: Database, tone: "text-sky-400" },
    { label: "活跃租户", value: "47", sub: "+3 本周", icon: User, tone: "text-violet-400" },
  ];

  const tenants = [
    { name: "Apollo Platform", tokens: "48.2M", cost: "$612.30", quota: 82, tone: "bg-emerald-400" },
    { name: "Helios DevOps", tokens: "31.7M", cost: "$398.10", quota: 68, tone: "bg-brand-accent" },
    { name: "Orion Compliance", tokens: "22.4M", cost: "$284.50", quota: 91, tone: "bg-yellow-400" },
    { name: "Nimbus Sales", tokens: "14.8M", cost: "$188.20", quota: 44, tone: "bg-sky-400" },
    { name: "Vega Research", tokens: "9.6M", cost: "$120.80", quota: 27, tone: "bg-violet-400" },
  ];

  return (
    <section id="cost" className="px-8 py-10 border-t border-brand-border">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-brand-muted uppercase tracking-widest">
            <Coins className="size-3.5 text-brand-accent" />
            cost_observability
          </div>
          <h2 className="text-xl font-semibold mt-1.5 tracking-tight">成本与配额</h2>
          <p className="text-xs text-brand-muted mt-1">
            按租户聚合 Token / 存储 / 推理花费，跟踪预算与配额告警。
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button className="px-2.5 py-1.5 rounded border border-brand-border text-brand-muted hover:text-brand-text">
            7D
          </button>
          <button className="px-2.5 py-1.5 rounded border border-brand-accent/40 bg-brand-accent/10 text-brand-accent">
            30D
          </button>
          <button className="px-2.5 py-1.5 rounded border border-brand-border text-brand-muted hover:text-brand-text">
            QTD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-xl border border-brand-border bg-brand-surface/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-brand-muted">{s.label}</span>
                <Icon className={`size-4 ${s.tone}`} />
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight font-mono">{s.value}</div>
              <div className="mt-1 text-[10px] text-brand-muted font-mono">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
          <span className="text-xs font-medium">租户用量明细 · Top 5</span>
          <span className="text-[10px] font-mono text-brand-muted">按 30 天累计花费排序</span>
        </div>
        <div className="divide-y divide-brand-border">
          {tenants.map((t) => (
            <div key={t.name} className="px-4 py-3 grid grid-cols-[1.4fr_1fr_1fr_2fr_auto] items-center gap-4 text-xs hover:bg-brand-surface/60 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${t.tone}`} />
                <span className="font-medium text-brand-text">{t.name}</span>
              </div>
              <span className="font-mono text-brand-muted">{t.tokens}</span>
              <span className="font-mono text-brand-text">{t.cost}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-brand-bg overflow-hidden ring-1 ring-brand-border">
                  <div
                    className={`h-full ${t.quota >= 85 ? "bg-yellow-400" : "bg-emerald-400"}`}
                    style={{ width: `${t.quota}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-brand-muted w-8 text-right">{t.quota}%</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecurityAuditSection() {
  const roles = [
    { role: "Owner", count: 3, perms: "全权限", tone: "success" as const },
    { role: "KB Admin", count: 8, perms: "知识库 / 模板", tone: "info" as const },
    { role: "Operator", count: 24, perms: "问答 / 评估", tone: "info" as const },
    { role: "Auditor", count: 5, perms: "只读 / 日志", tone: "warning" as const },
  ];

  const logs = [
    { t: "10:42:18", actor: "alice@matrix.io", action: "更新提示词模板 rag_standard.v12 → v13", level: "info" as const, icon: Wand2 },
    { t: "10:38:02", actor: "system", action: "向量索引 vec_prod_2 自动重建完成 (4.2M 条)", level: "success" as const, icon: CheckCircle2 },
    { t: "10:33:51", actor: "bob@matrix.io", action: "导出 evaluation_run_8821 评估报告", level: "info" as const, icon: ScrollText },
    { t: "10:21:30", actor: "ci-bot", action: "拒绝部署模板 compliance.v4 — 缺少回滚版本", level: "danger" as const, icon: AlertTriangle },
    { t: "10:14:07", actor: "carol@matrix.io", action: "登录 · IP 10.8.42.19 · 区域 cn-shanghai", level: "info" as const, icon: KeyRound },
    { t: "09:58:44", actor: "system", action: "API Key kb_live_*8a72 即将于 7 天后过期", level: "warning" as const, icon: Bell },
  ];

  const toneStyles: Record<string, string> = {
    info: "text-brand-muted",
    success: "text-emerald-400",
    warning: "text-yellow-400",
    danger: "text-rose-400",
  };

  return (
    <section id="security" className="px-8 py-10 border-t border-brand-border">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-brand-muted uppercase tracking-widest">
            <Lock className="size-3.5 text-brand-accent" />
            security_audit
          </div>
          <h2 className="text-xl font-semibold mt-1.5 tracking-tight">权限与审计</h2>
          <p className="text-xs text-brand-muted mt-1">
            细粒度角色 · 操作审计 · 密钥与会话治理。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> SOC2 / ISO27001 已通过
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">
        <div className="space-y-3">
          <div className="rounded-xl border border-brand-border bg-brand-surface/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-border text-xs font-medium flex items-center justify-between">
              <span>角色矩阵</span>
              <span className="text-[10px] font-mono text-brand-muted">40 成员</span>
            </div>
            <div className="divide-y divide-brand-border">
              {roles.map((r) => (
                <div key={r.role} className="px-4 py-3 flex items-center gap-3 text-xs">
                  <div className="size-7 rounded-md bg-brand-bg ring-1 ring-brand-border grid place-items-center">
                    <ShieldCheck className="size-3.5 text-brand-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{r.role}</div>
                    <div className="text-[10px] font-mono text-brand-muted">{r.perms}</div>
                  </div>
                  <span className="font-mono text-brand-text">{r.count}</span>
                  <StatusBadge tone={r.tone} label="启用" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium flex items-center gap-2">
                <KeyRound className="size-3.5 text-brand-accent" /> API 密钥
              </span>
              <span className="text-[10px] font-mono text-brand-muted">3 活跃 · 1 即将过期</span>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-brand-bg/60 ring-1 ring-brand-border">
                <span className="text-brand-text">kb_live_…3f29</span>
                <span className="text-emerald-400">90d 剩余</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-brand-bg/60 ring-1 ring-brand-border">
                <span className="text-brand-text">kb_live_…8a72</span>
                <span className="text-yellow-400">7d 即将过期</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-brand-bg/60 ring-1 ring-brand-border">
                <span className="text-brand-text">kb_ci_…b104</span>
                <span className="text-emerald-400">182d 剩余</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-2">
              <ScrollText className="size-3.5 text-brand-accent" /> 实时审计流
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-muted">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live · 24h 内 1,284 事件
            </div>
          </div>
          <div className="divide-y divide-brand-border max-h-[360px] overflow-y-auto">
            {logs.map((l, i) => {
              const Icon = l.icon;
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3 text-xs hover:bg-brand-surface/60 transition-colors">
                  <span className="font-mono text-[10px] text-brand-muted shrink-0 mt-0.5 w-16">{l.t}</span>
                  <Icon className={`size-3.5 shrink-0 mt-0.5 ${toneStyles[l.level]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-brand-text">{l.action}</div>
                    <div className="text-[10px] font-mono text-brand-muted mt-0.5">{l.actor}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function IncidentTimelineSection() {
  const events = [
    {
      time: "11:02",
      title: "向量检索 P95 延迟回落至 126ms",
      detail: "Qdrant 节点 vec-2 完成索引合并，副本回到 3/3。",
      tone: "success" as const,
      icon: CheckCircle2,
    },
    {
      time: "10:47",
      title: "Notion 连接器触发 429 限流",
      detail: "已自动切换增量同步窗口，3 分钟后重试。",
      tone: "warning" as const,
      icon: AlertTriangle,
    },
    {
      time: "10:21",
      title: "模板部署被 CI 拦截",
      detail: "compliance.v4 缺少回滚版本，构建任务 #8821 失败。",
      tone: "danger" as const,
      icon: AlertTriangle,
    },
    {
      time: "09:30",
      title: "夜间评估批次完成",
      detail: "Recall@5 90.2% · Precision 86.4% · 较昨日 +1.8pp。",
      tone: "info" as const,
      icon: BarChart3,
    },
    {
      time: "08:00",
      title: "知识库快照 snap_20260606 已归档",
      detail: "对象存储 cn-shanghai-cold · 大小 218GB。",
      tone: "info" as const,
      icon: Database,
    },
  ];

  const toneRing: Record<string, string> = {
    success: "ring-emerald-400/40 bg-emerald-400/10 text-emerald-400",
    warning: "ring-yellow-400/40 bg-yellow-400/10 text-yellow-400",
    danger: "ring-rose-400/40 bg-rose-400/10 text-rose-400",
    info: "ring-brand-accent/40 bg-brand-accent/10 text-brand-accent",
  };

  return (
    <section id="incidents" className="px-8 py-10 border-t border-brand-border">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-brand-muted uppercase tracking-widest">
            <Clock className="size-3.5 text-brand-accent" />
            incident_timeline
          </div>
          <h2 className="text-xl font-semibold mt-1.5 tracking-tight">事件时间线</h2>
          <p className="text-xs text-brand-muted mt-1">
            统一汇总 24 小时内的部署、告警、评估、运维事件。
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-brand-muted">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" /> 4 成功</span>
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-yellow-400" /> 2 警告</span>
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-rose-400" /> 1 故障</span>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface/40 p-6">
        <ol className="relative border-l border-brand-border ml-3 space-y-5">
          {events.map((e, i) => {
            const Icon = e.icon;
            return (
              <li key={i} className="pl-6 relative">
                <span className={`absolute -left-[13px] top-0 size-6 rounded-full grid place-items-center ring-1 ${toneRing[e.tone]}`}>
                  <Icon className="size-3" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-brand-text">{e.title}</span>
                  <span className="text-[10px] font-mono text-brand-muted">· {e.time}</span>
                </div>
                <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">{e.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

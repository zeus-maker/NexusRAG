import { useState, ReactNode } from 'react';
import {
  Database, MessageSquare, BarChart2, Settings, Users, Shield,
  GitBranch, FileSearch, Monitor, Bell, HelpCircle, ChevronLeft,
  ChevronRight, ChevronDown, LogOut, Sun, Moon, Search, Zap, Home,
  Bot, Lock, Cpu, Activity, BookOpen, Layers, Network
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  page: string;
  children?: { key: string; label: string; icon: ReactNode; page: string }[];
}

const navItems: NavItem[] = [
  { key: 'home', label: '工作台', icon: <Home size={18} />, page: 'home' },
  { key: 'kb', label: '知识库管理', icon: <Database size={18} />, page: 'kb-list' },
  { key: 'chat', label: '智能对话', icon: <MessageSquare size={18} />, page: 'chat' },
  { key: 'search', label: '搜索应用', icon: <Search size={18} />, page: 'search' },
  { key: 'agent', label: 'Agent 编排', icon: <Bot size={18} />, page: 'agent' },
  { key: 'eval', label: '评测中心', icon: <BarChart2 size={18} />, page: 'eval-dashboard' },
  {
    key: 'system', label: '系统管理', icon: <Settings size={18} />, page: '',
    children: [
      { key: 'sys-users', label: '用户管理', icon: <Users size={15} />, page: 'sys-users' },
      { key: 'sys-roles', label: '角色权限', icon: <Shield size={15} />, page: 'sys-roles' },
      { key: 'sys-pipeline', label: '流水线配置', icon: <GitBranch size={15} />, page: 'sys-pipeline' },
      { key: 'sys-classifier', label: '分类器路由', icon: <Activity size={15} />, page: 'sys-classifier' },
      { key: 'sys-security', label: '安全合规', icon: <Lock size={15} />, page: 'sys-security' },
      { key: 'sys-models', label: '模型管理', icon: <Cpu size={15} />, page: 'sys-models' },
      { key: 'sys-audit', label: '审计日志', icon: <FileSearch size={15} />, page: 'sys-audit' },
      { key: 'sys-monitor', label: '系统监控', icon: <Monitor size={15} />, page: 'sys-monitor' },
      { key: 'sys-traces', label: 'Traces', icon: <Activity size={15} />, page: 'sys-traces' },
    ],
  },
];

const SYSTEM_PAGES = [
  'sys-users', 'sys-roles', 'sys-pipeline', 'sys-classifier',
  'sys-security', 'sys-models', 'sys-audit', 'sys-monitor', 'sys-traces', 'sys-api',
];
const HUB_PAGES = ['wiki-hub', 'pageindex-hub', 'graphrag-hub'];
const KB_PAGES = [
  'kb-list', 'kb-recycle-bin', 'kb-detail', 'kb-documents', 'kb-chunks', 'kb-index-status', 'kb-settings',
  'kb-retrieval-test', 'kb-wiki', 'kb-pageindex-tree', 'kb-wiki-manage', 'kb-pageindex-manage',
  ...HUB_PAGES,
];
const EVAL_PAGES = ['eval-dashboard', 'eval-tasks', 'eval-ab-test', 'eval-datasets', 'eval-satisfaction', 'eval-cost', 'eval-replay', 'eval-route-learning'];

const hubItems = [
  { key: 'wiki-hub', label: 'Wiki Hub', icon: <BookOpen size={15} />, page: 'wiki-hub' },
  { key: 'pageindex-hub', label: 'PageIndex Hub', icon: <GitBranch size={15} />, page: 'pageindex-hub' },
  { key: 'graphrag-hub', label: 'GraphRAG Hub', icon: <Network size={15} />, page: 'graphrag-hub' },
];

interface SidebarProps {
  collapsed: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ collapsed, currentPage, onNavigate }: SidebarProps) {
  const [expandedSys, setExpandedSys] = useState(SYSTEM_PAGES.includes(currentPage));
  const [showHubs, setShowHubs] = useState(HUB_PAGES.includes(currentPage));

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}
    >
      <div className={`flex items-center gap-2.5 h-12 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">RAG 3.0</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500">企业知识库系统</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(item => {
          if (item.children) {
            const childActive = SYSTEM_PAGES.includes(currentPage);
            return (
              <div key={item.key}>
                <button
                  onClick={() => !collapsed && setExpandedSys(p => !p)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'} ${childActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight size={13} className={`transition-transform text-gray-400 ${expandedSys ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </button>
                {!collapsed && expandedSys && (
                  <div className="bg-gray-50/70 dark:bg-gray-900/50">
                    {item.children.map(child => (
                      <button
                        key={child.key}
                        onClick={() => onNavigate(child.page)}
                        className={`w-full flex items-center gap-2.5 pl-9 pr-4 py-2 text-sm transition-colors ${child.page === currentPage ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            item.page === currentPage ||
            (item.key === 'kb' && KB_PAGES.includes(currentPage)) ||
            (item.key === 'eval' && EVAL_PAGES.includes(currentPage));

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'} ${isActive ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {!collapsed && (
          <div className="mt-3 px-2">
            <button
              onClick={() => setShowHubs(p => !p)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-400"
            >
              <span>RAG 3.0 增强层</span>
              <ChevronDown size={12} className={`transition-transform ${showHubs ? 'rotate-180' : ''}`} />
            </button>
            {showHubs && (
              <div className="mt-0.5">
                {hubItems.map(hub => (
                  <button
                    key={hub.key}
                    onClick={() => onNavigate(hub.page)}
                    className={`w-full flex items-center gap-2.5 pl-4 pr-3 py-2 text-sm transition-colors rounded-lg mx-1 ${
                      hub.page === currentPage
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {hub.icon}
                    <span>{hub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>PROD 环境 · v3.0.1</span>
          </div>
        </div>
      )}
    </aside>
  );
}

const breadcrumbMap: Record<string, string[]> = {
  'home': ['工作台'],
  'kb-list': ['知识库管理'],
  'kb-recycle-bin': ['知识库管理', '回收站'],
  'kb-detail': ['知识库管理', '知识库详情'],
  'kb-documents': ['知识库管理', '文档管理'],
  'kb-chunks': ['知识库管理', '分块预览'],
  'kb-index-status': ['知识库管理', '索引状态'],
  'kb-settings': ['知识库管理', '配置'],
  'kb-retrieval-test': ['知识库管理', '检索测试'],
  'kb-wiki': ['知识库管理', 'Wiki 浏览器'],
  'kb-pageindex-tree': ['知识库管理', 'PageIndex 树'],
  'kb-wiki-manage': ['Wiki 管理'],
  'kb-pageindex-manage': ['PageIndex 管理'],
  'wiki-hub': ['知识库管理', 'Wiki Hub'],
  'pageindex-hub': ['知识库管理', 'PageIndex Hub'],
  'graphrag-hub': ['知识库管理', 'GraphRAG Hub'],
  'chat': ['智能对话'],
  'search': ['搜索应用'],
  'agent': ['Agent 编排'],
  'eval-dashboard': ['评测中心', '仪表盘'],
  'eval-tasks': ['评测中心', '评测任务'],
  'eval-ab-test': ['评测中心', 'A/B 测试'],
  'eval-datasets': ['评测中心', '评测数据集'],
  'eval-satisfaction': ['评测中心', '用户满意度'],
  'eval-cost': ['评测中心', '成本分析'],
  'eval-replay': ['评测中心', '回放评测'],
  'eval-route-learning': ['评测中心', '路由学习'],
  'sys-users': ['系统管理', '用户管理'],
  'sys-roles': ['系统管理', '角色权限'],
  'sys-pipeline': ['系统管理', '流水线配置'],
  'sys-classifier': ['系统管理', '分类器路由'],
  'sys-security': ['系统管理', '安全合规'],
  'sys-models': ['系统管理', '模型管理'],
  'sys-audit': ['系统管理', '审计日志'],
  'sys-monitor': ['系统管理', '系统监控'],
  'sys-traces': ['系统管理', 'Traces'],
  'sys-api': ['系统管理', 'API 管理'],
};

interface TopBarProps {
  collapsed: boolean;
  onToggle: () => void;
  onThemeToggle: () => void;
  theme: string;
  currentUser: { name: string; role: string } | null;
  onLogout: () => void;
  currentPage: string;
}

export function TopBar({ collapsed, onToggle, onThemeToggle, theme, currentUser, onLogout, currentPage }: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const crumbs = breadcrumbMap[currentPage] || [];

  return (
    <header className="h-12 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 relative z-30">
      <button onClick={onToggle} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0">
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>}
            <span className={`truncate ${i === crumbs.length - 1 ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{c}</span>
          </span>
        ))}
      </div>

      <div className="relative hidden md:flex items-center flex-shrink-0">
        <Search size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="搜索知识库、文档..."
          className="pl-7 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-52 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="relative flex-shrink-0">
        <button onClick={() => { setShowNotif(p => !p); setShowUserMenu(false); }} className="relative p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        {showNotif && (
          <div className="absolute right-0 top-10 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-100">通知中心</div>
            {[
              { icon: '✅', text: '供应商合同模板V5.pdf 解析完成，质量评分 96 分', time: '2分钟前', color: 'bg-green-50' },
              { icon: '📊', text: '6月Faithfulness评测完成，综合得分 0.92', time: '1小时前', color: 'bg-blue-50' },
              { icon: '⚠️', text: 'PageIndex 流水线进度 54.5%，预计还需 45 分钟', time: '3小时前', color: 'bg-yellow-50' },
            ].map((n, i) => (
              <div key={i} className={`px-4 py-3 ${n.color} border-b border-white/60 cursor-pointer hover:brightness-95 transition-all`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{n.text}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-4 py-2 text-center">
              <button className="text-xs text-blue-600 hover:underline">查看全部通知</button>
            </div>
          </div>
        )}
      </div>

      <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:block">
        <HelpCircle size={16} />
      </button>

      <button
        onClick={onThemeToggle}
        title={theme === 'light' ? '切换夜间模式' : '切换浅色模式'}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowUserMenu(p => !p); setShowNotif(false); }}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{currentUser?.name?.[0] || 'U'}</span>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">{currentUser?.name}</span>
        </button>
        {showUserMenu && (
          <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => { setShowUserMenu(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={14} />
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

interface StatusBarProps {
  theme?: string;
}

export function StatusBar({ theme: _theme }: StatusBarProps = {}) {
  return (
    <div className="h-6 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span>连接正常</span>
      </div>
      <div className="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>
      <span>延迟 120ms</span>
      <div className="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>
      <span>PROD 环境</span>
      <div className="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>
      <span>v3.0.1</span>
      <div className="flex-1"></div>
      <span>© 2026 RAG 3.0 Knowledge Base System</span>
    </div>
  );
}

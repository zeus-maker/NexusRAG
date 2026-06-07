import { BarChart2, ListChecks, FlaskConical, Database, ThumbsUp, DollarSign, RotateCcw, Brain } from 'lucide-react';

const EVAL_TABS = [
  { page: 'eval-dashboard', label: '仪表盘', icon: <BarChart2 size={14} /> },
  { page: 'eval-tasks', label: '评测任务', icon: <ListChecks size={14} /> },
  { page: 'eval-ab-test', label: 'A/B 测试', icon: <FlaskConical size={14} /> },
  { page: 'eval-datasets', label: '评测数据集', icon: <Database size={14} /> },
  { page: 'eval-satisfaction', label: '用户满意度', icon: <ThumbsUp size={14} /> },
  { page: 'eval-cost', label: '成本分析', icon: <DollarSign size={14} /> },
  { page: 'eval-replay', label: '回放评测', icon: <RotateCcw size={14} /> },
  { page: 'eval-route-learning', label: '路由学习', icon: <Brain size={14} /> },
];

interface EvalSubNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function EvalSubNav({ currentPage, onNavigate }: EvalSubNavProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-px scrollbar-thin">
      {EVAL_TABS.map(tab => (
        <button
          key={tab.page}
          type="button"
          onClick={() => onNavigate(tab.page)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
            currentPage === tab.page
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

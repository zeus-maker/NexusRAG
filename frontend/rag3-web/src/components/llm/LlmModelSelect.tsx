import type { LlmSelectOption } from '../../services/llmApi';

interface LlmModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LlmSelectOption[];
  loading?: boolean;
  placeholder?: string;
  emptyHint?: string;
  className?: string;
  disabled?: boolean;
}

export function LlmModelSelect({
  value,
  onChange,
  options,
  loading,
  placeholder = '选择模型…',
  emptyHint = '请先配置平台 API KEY',
  className = 'w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600',
  disabled,
}: LlmModelSelectProps) {
  const available = options.filter(o => !o.disabled);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled || loading || available.length === 0}
      className={`${className} disabled:opacity-60`}
    >
      <option value="">
        {loading ? '加载中…' : available.length === 0 ? emptyHint : placeholder}
      </option>
      {options.map(o => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}{o.disabled ? '（未配置 KEY）' : ''}
        </option>
      ))}
    </select>
  );
}

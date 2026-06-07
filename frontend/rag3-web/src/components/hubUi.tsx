import { ReactNode } from 'react';

export const hubCard = 'bg-white rounded-xl border border-gray-200 transition-colors';
export const hubInput =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
export const hubSelect =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export function HubBadge({
  variant,
  children,
}: {
  variant: 'active' | 'indexing' | 'error' | 'draft';
  children: ReactNode;
}) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    indexing: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function HubStatCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconColor?: string;
}) {
  return (
    <div className={`${hubCard} p-4`}>
      <div className="mb-2" style={iconColor ? { color: iconColor } : undefined}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export function BtnPrimary({
  children,
  onClick,
  className = '',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  onClick,
  className = '',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

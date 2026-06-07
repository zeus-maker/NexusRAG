import { useEffect, useState } from 'react';
import { Loader, X } from 'lucide-react';
import {
  DEFAULT_UPLOAD_CONFIG,
  type DocumentUploadConfig,
} from '../../data/documentUploadConfig';
import { DocumentUploadConfigPanel } from './DocumentUploadConfigPanel';

interface Props {
  open: boolean;
  title?: string;
  fileCount: number;
  initialConfig?: DocumentUploadConfig;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (config: DocumentUploadConfig) => void;
}

export function DocumentUploadConfigDialog({
  open,
  title = '上传并解析配置',
  fileCount,
  initialConfig,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [config, setConfig] = useState<DocumentUploadConfig>(DEFAULT_UPLOAD_CONFIG);

  useEffect(() => {
    if (open) {
      setConfig(initialConfig ? { ...initialConfig } : { ...DEFAULT_UPLOAD_CONFIG });
    }
  }, [open, initialConfig]);

  if (!open) return null;

  const patch = (partial: Partial<DocumentUploadConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DocumentUploadConfigPanel config={config} onChange={patch} fileCount={fileCount} />
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            取消
          </button>
          <button
            type="button"
            disabled={submitting || fileCount < 1}
            onClick={() => onConfirm(config)}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting && <Loader size={14} className="animate-spin" />}
            {submitting ? '处理中…' : '确认上传'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { X, CheckCircle2, AlertCircle, Bell, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface StackedToastProps {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  index: number; // 0 is top (newest)
  total: number;
  onClose: () => void;
}

export const StackedToast: React.FC<StackedToastProps> = ({ title, message, type, index, total, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="text-green-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <Bell className="text-primary-500" size={18} />,
  };

  // Stack effect: 
  // - Top toast (index 0) has full opacity and scale 1
  // - Toasts below are scaled down, moved down, and have lower opacity
  const isCompact = index > 0;
  const scale = Math.max(0.8, 1 - index * 0.05);
  const opacity = Math.max(0, 1 - index * 0.3);
  const translateY = index * 12; // Gap between stacked toasts
  const zIndex = 100 - index;

  return (
    <div
      className={`
        pointer-events-auto
        w-[360px] bg-white rounded-2xl border border-gray-100 shadow-2xl p-4
        flex items-start gap-4 transition-all duration-500 ease-out
        ${index === 0 ? 'animate-fade-in-up' : ''}
      `}
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity: opacity,
        zIndex: zIndex,
        position: index > 0 ? 'absolute' : 'relative',
        bottom: 0,
        right: 0,
      }}
    >
      <div className="p-2 bg-gray-50 rounded-xl shrink-0">
        {icons[type]}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-bold text-gray-900 truncate">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{message}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
};

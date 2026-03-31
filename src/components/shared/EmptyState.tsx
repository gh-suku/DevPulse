// Empty state component with actionable CTAs
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12 text-gray-400">
      <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-semibold text-gray-600 mb-2">{title}</p>
      <p className="text-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Issue #5: Standardized Loading Skeleton Components
// Provides consistent loading states across the application

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse bg-gray-200 rounded',
      className
    )}
  />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-6 w-3/4" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-100">
    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
  </tr>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
    <Skeleton className="h-5 w-5 rounded" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

export const GoalCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-16 ml-auto" />
    </div>
  </div>
);

export const AttributeCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
    <Skeleton className="h-5 w-32" />
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-5 w-5" />
      ))}
    </div>
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-3 w-20" />
  </div>
);

interface SkeletonGroupProps {
  count?: number;
  type?: 'card' | 'list' | 'table' | 'goal' | 'attribute';
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({ 
  count = 3, 
  type = 'card' 
}) => {
  const SkeletonComponent = {
    card: CardSkeleton,
    list: ListItemSkeleton,
    table: TableRowSkeleton,
    goal: GoalCardSkeleton,
    attribute: AttributeCardSkeleton,
  }[type];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </>
  );
};

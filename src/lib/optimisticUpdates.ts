// Issue #43: Optimistic Updates Implementation
// Provides utilities for optimistic UI updates with rollback on error

import { useState, useCallback } from 'react';

export interface OptimisticUpdate<T> {
  id: string;
  data: T;
  timestamp: number;
}

export function useOptimisticUpdate<T extends { id: string }>(
  initialData: T[],
  updateFn: (data: T[]) => Promise<void>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, T>>(new Map());

  const optimisticUpdate = useCallback(
    async (id: string, updates: Partial<T>) => {
      // Store original data for rollback
      const original = data.find(item => item.id === id);
      if (!original) return;

      // Apply optimistic update immediately
      const optimisticData = data.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      setData(optimisticData);
      setPendingUpdates(prev => new Map(prev).set(id, original));

      try {
        // Perform actual update
        await updateFn(optimisticData);
        // Success - remove from pending
        setPendingUpdates(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      } catch (error) {
        // Rollback on error
        setData(prev =>
          prev.map(item => (item.id === id ? original : item))
        );
        setPendingUpdates(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        throw error;
      }
    },
    [data, updateFn]
  );

  const optimisticAdd = useCallback(
    async (newItem: T) => {
      // Add optimistically
      setData(prev => [newItem, ...prev]);

      try {
        await updateFn([newItem, ...data]);
      } catch (error) {
        // Rollback on error
        setData(prev => prev.filter(item => item.id !== newItem.id));
        throw error;
      }
    },
    [data, updateFn]
  );

  const optimisticDelete = useCallback(
    async (id: string) => {
      const original = data.find(item => item.id === id);
      if (!original) return;

      // Remove optimistically
      setData(prev => prev.filter(item => item.id !== id));
      setPendingUpdates(prev => new Map(prev).set(id, original));

      try {
        await updateFn(data.filter(item => item.id !== id));
        setPendingUpdates(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      } catch (error) {
        // Rollback on error
        setData(prev => [...prev, original]);
        setPendingUpdates(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        throw error;
      }
    },
    [data, updateFn]
  );

  return {
    data,
    setData,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
    hasPendingUpdates: pendingUpdates.size > 0,
  };
}

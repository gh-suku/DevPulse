// Issue #35: Memoization Utilities
// Provides utilities for optimizing expensive computations

import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Memoize expensive calculations with dependencies
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Memoize callback functions
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Deep comparison memoization
 * Useful when dependencies are objects or arrays
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Deep equality check for objects and arrays
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}

/**
 * Memoize async operations with caching
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T
): { value: T; loading: boolean; error: Error | null } {
  const [state, setState] = React.useState<{
    value: T;
    loading: boolean;
    error: Error | null;
  }>({
    value: initialValue,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    factory()
      .then(value => {
        if (!cancelled) {
          setState({ value, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false, error }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}

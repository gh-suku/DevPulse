// Issue #3: Enhanced Mobile Responsiveness
// Utilities and hooks for responsive design

import { useState, useEffect } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else if (width >= breakpoints.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if screen is mobile
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

/**
 * Hook to check if screen is tablet
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

/**
 * Hook to check if screen is desktop
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

/**
 * Get responsive grid columns based on breakpoint
 */
export function getResponsiveColumns(breakpoint: Breakpoint): number {
  const columnMap: Record<Breakpoint, number> = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4,
  };
  return columnMap[breakpoint];
}

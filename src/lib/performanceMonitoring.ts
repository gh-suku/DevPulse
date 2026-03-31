/**
 * Performance Monitoring Utilities
 * 
 * Monitor and track application performance metrics
 * Helps identify performance bottlenecks and optimization opportunities
 */

export interface PerformanceMetrics {
  // Page load metrics
  dns?: number;
  tcp?: number;
  ttfb?: number; // Time to First Byte
  download?: number;
  domInteractive?: number;
  domComplete?: number;
  loadComplete?: number;
  
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  
  // Custom metrics
  apiLatency?: number;
  renderTime?: number;
  
  // Context
  url: string;
  timestamp: number;
  userAgent: string;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size?: number;
  cached: boolean;
}

/**
 * Collect navigation timing metrics
 */
export function getNavigationMetrics(): Partial<PerformanceMetrics> | null {
  if (!('performance' in window) || !performance.getEntriesByType) {
    return null;
  }

  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  
  if (!navigation) return null;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };
}

/**
 * Collect Core Web Vitals
 */
export function observeWebVitals(callback: (metrics: Partial<PerformanceMetrics>) => void): void {
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported');
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      callback({
        lcp: lastEntry.renderTime || lastEntry.loadTime,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observation failed:', e);
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        callback({
          fid: entry.processingStart - entry.startTime,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observation failed:', e);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      callback({
        cls: clsValue,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observation failed:', e);
  }

  // First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          callback({
            fcp: entry.startTime,
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          });
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('FCP observation failed:', e);
  }
}

/**
 * Get resource timing information
 */
export function getResourceTimings(): ResourceTiming[] {
  if (!('performance' in window) || !performance.getEntriesByType) {
    return [];
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    type: getResourceType(resource.name),
    duration: resource.duration,
    size: resource.transferSize,
    cached: resource.transferSize === 0 && resource.decodedBodySize > 0
  }));
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  if (url.match(/\.(js|mjs)$/)) return 'script';
  if (url.match(/\.css$/)) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
  if (url.match(/\.(mp4|webm|ogg)$/)) return 'video';
  if (url.match(/\.(mp3|wav|ogg)$/)) return 'audio';
  return 'other';
}

/**
 * Measure API call latency
 */
export function measureApiLatency(url: string, startTime: number): number {
  return performance.now() - startTime;
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void): number {
  const start = performance.now();
  callback();
  const duration = performance.now() - start;
  
  console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
  
  return duration;
}

/**
 * Create performance mark
 */
export function mark(name: string): void {
  if ('performance' in window && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string): number | null {
  if (!('performance' in window) || !performance.measure) {
    return null;
  }

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name, 'measure')[0];
    return measure ? measure.duration : null;
  } catch (e) {
    console.warn('Performance measurement failed:', e);
    return null;
  }
}

/**
 * Clear performance marks and measures
 */
export function clearMarks(): void {
  if ('performance' in window) {
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

/**
 * Performance budget checker
 */
export const performanceBudget = {
  // Page load metrics (milliseconds)
  ttfb: 600,
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  loadComplete: 3000,
  
  // Resource sizes (bytes)
  totalPageSize: 2 * 1024 * 1024, // 2MB
  scriptSize: 500 * 1024, // 500KB
  styleSize: 100 * 1024, // 100KB
  imageSize: 1 * 1024 * 1024, // 1MB
};

/**
 * Check if metrics meet performance budget
 */
export function checkPerformanceBudget(metrics: Partial<PerformanceMetrics>): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (metrics.ttfb && metrics.ttfb > performanceBudget.ttfb) {
    violations.push(`TTFB: ${metrics.ttfb.toFixed(0)}ms (budget: ${performanceBudget.ttfb}ms)`);
  }

  if (metrics.fcp && metrics.fcp > performanceBudget.fcp) {
    violations.push(`FCP: ${metrics.fcp.toFixed(0)}ms (budget: ${performanceBudget.fcp}ms)`);
  }

  if (metrics.lcp && metrics.lcp > performanceBudget.lcp) {
    violations.push(`LCP: ${metrics.lcp.toFixed(0)}ms (budget: ${performanceBudget.lcp}ms)`);
  }

  if (metrics.fid && metrics.fid > performanceBudget.fid) {
    violations.push(`FID: ${metrics.fid.toFixed(0)}ms (budget: ${performanceBudget.fid}ms)`);
  }

  if (metrics.cls && metrics.cls > performanceBudget.cls) {
    violations.push(`CLS: ${metrics.cls.toFixed(3)} (budget: ${performanceBudget.cls})`);
  }

  if (metrics.loadComplete && metrics.loadComplete > performanceBudget.loadComplete) {
    violations.push(`Load: ${metrics.loadComplete.toFixed(0)}ms (budget: ${performanceBudget.loadComplete}ms)`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Log performance summary
 */
export function logPerformanceSummary(): void {
  const metrics = getNavigationMetrics();
  if (!metrics) {
    console.warn('Performance metrics not available');
    return;
  }

  const budget = checkPerformanceBudget(metrics);
  const resources = getResourceTimings();

  console.group('⚡ Performance Summary');
  console.log('URL:', metrics.url);
  console.log('Timestamp:', new Date(metrics.timestamp).toISOString());
  
  console.group('Navigation Timing');
  console.log('DNS:', metrics.dns?.toFixed(0), 'ms');
  console.log('TCP:', metrics.tcp?.toFixed(0), 'ms');
  console.log('TTFB:', metrics.ttfb?.toFixed(0), 'ms');
  console.log('Download:', metrics.download?.toFixed(0), 'ms');
  console.log('DOM Interactive:', metrics.domInteractive?.toFixed(0), 'ms');
  console.log('DOM Complete:', metrics.domComplete?.toFixed(0), 'ms');
  console.log('Load Complete:', metrics.loadComplete?.toFixed(0), 'ms');
  console.groupEnd();

  console.group('Resources');
  const byType = resources.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`${type}:`, count);
  });
  console.groupEnd();

  console.group('Performance Budget');
  console.log('Status:', budget.passed ? '✅ PASSED' : '❌ FAILED');
  if (budget.violations.length > 0) {
    console.warn('Violations:');
    budget.violations.forEach(v => console.warn('  -', v));
  }
  console.groupEnd();

  console.groupEnd();
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(options: {
  logOnLoad?: boolean;
  trackWebVitals?: boolean;
  sendToAnalytics?: (metrics: Partial<PerformanceMetrics>) => void;
} = {}): void {
  const { logOnLoad = true, trackWebVitals = true, sendToAnalytics } = options;

  // Log on page load
  if (logOnLoad) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        logPerformanceSummary();
      }, 0);
    });
  }

  // Track Web Vitals
  if (trackWebVitals) {
    observeWebVitals((metrics) => {
      if (sendToAnalytics) {
        sendToAnalytics(metrics);
      }
    });
  }
}

export default {
  getNavigationMetrics,
  observeWebVitals,
  getResourceTimings,
  measureApiLatency,
  measureRenderTime,
  mark,
  measure,
  clearMarks,
  getMemoryUsage,
  checkPerformanceBudget,
  logPerformanceSummary,
  initPerformanceMonitoring,
  performanceBudget
};

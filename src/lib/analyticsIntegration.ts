/**
 * Analytics Integration
 * 
 * Centralized analytics tracking for user behavior and performance
 * Supports multiple analytics providers
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  username?: string;
  properties?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  providers: {
    googleAnalytics?: {
      measurementId: string;
    };
    mixpanel?: {
      token: string;
    };
    amplitude?: {
      apiKey: string;
    };
    plausible?: {
      domain: string;
    };
  };
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private user: AnalyticsUser | null = null;
  private queue: AnalyticsEvent[] = [];

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.initializeProviders();
  }

  /**
   * Initialize analytics providers
   */
  private initializeProviders(): void {
    if (!this.config.enabled) {
      console.log('[Analytics] Disabled');
      return;
    }

    // Google Analytics 4
    if (this.config.providers.googleAnalytics) {
      this.initGoogleAnalytics(this.config.providers.googleAnalytics.measurementId);
    }

    // Mixpanel
    if (this.config.providers.mixpanel) {
      this.initMixpanel(this.config.providers.mixpanel.token);
    }

    // Amplitude
    if (this.config.providers.amplitude) {
      this.initAmplitude(this.config.providers.amplitude.apiKey);
    }

    // Plausible
    if (this.config.providers.plausible) {
      this.initPlausible(this.config.providers.plausible.domain);
    }

    // Process queued events
    this.processQueue();
  }

  /**
   * Initialize Google Analytics
   */
  private initGoogleAnalytics(measurementId: string): void {
    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId);

    if (this.config.debug) {
      console.log('[Analytics] Google Analytics initialized:', measurementId);
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initMixpanel(token: string): void {
    // In production, load Mixpanel SDK
    // For now, just log
    if (this.config.debug) {
      console.log('[Analytics] Mixpanel initialized:', token);
    }
  }

  /**
   * Initialize Amplitude
   */
  private initAmplitude(apiKey: string): void {
    // In production, load Amplitude SDK
    // For now, just log
    if (this.config.debug) {
      console.log('[Analytics] Amplitude initialized:', apiKey);
    }
  }

  /**
   * Initialize Plausible
   */
  private initPlausible(domain: string): void {
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', domain);
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);

    if (this.config.debug) {
      console.log('[Analytics] Plausible initialized:', domain);
    }
  }

  /**
   * Track an event
   */
  track(name: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now()
    };

    if (!this.config.enabled) {
      if (this.config.debug) {
        console.log('[Analytics] Event (disabled):', event);
      }
      return;
    }

    // Queue event if providers not ready
    if (this.queue.length > 0) {
      this.queue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Send event to all providers
   */
  private sendEvent(event: AnalyticsEvent): void {
    if (this.config.debug) {
      console.log('[Analytics] Event:', event);
    }

    // Google Analytics
    if (this.config.providers.googleAnalytics && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties);
    }

    // Mixpanel
    if (this.config.providers.mixpanel && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.name, event.properties);
    }

    // Amplitude
    if (this.config.providers.amplitude && (window as any).amplitude) {
      (window as any).amplitude.track(event.name, event.properties);
    }

    // Plausible (custom events)
    if (this.config.providers.plausible && (window as any).plausible) {
      (window as any).plausible(event.name, { props: event.properties });
    }
  }

  /**
   * Process queued events
   */
  private processQueue(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  /**
   * Identify user
   */
  identify(user: AnalyticsUser): void {
    this.user = user;

    if (!this.config.enabled) {
      if (this.config.debug) {
        console.log('[Analytics] Identify (disabled):', user);
      }
      return;
    }

    if (this.config.debug) {
      console.log('[Analytics] Identify:', user);
    }

    // Google Analytics
    if (this.config.providers.googleAnalytics && (window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_id: user.id,
        ...user.properties
      });
    }

    // Mixpanel
    if (this.config.providers.mixpanel && (window as any).mixpanel) {
      (window as any).mixpanel.identify(user.id);
      if (user.properties) {
        (window as any).mixpanel.people.set(user.properties);
      }
    }

    // Amplitude
    if (this.config.providers.amplitude && (window as any).amplitude) {
      (window as any).amplitude.setUserId(user.id);
      if (user.properties) {
        (window as any).amplitude.setUserProperties(user.properties);
      }
    }
  }

  /**
   * Track page view
   */
  page(path?: string, properties?: Record<string, any>): void {
    const pagePath = path || window.location.pathname;
    
    this.track('page_view', {
      path: pagePath,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      ...properties
    });
  }

  /**
   * Reset user identity
   */
  reset(): void {
    this.user = null;

    if (!this.config.enabled) return;

    // Mixpanel
    if (this.config.providers.mixpanel && (window as any).mixpanel) {
      (window as any).mixpanel.reset();
    }

    // Amplitude
    if (this.config.providers.amplitude && (window as any).amplitude) {
      (window as any).amplitude.setUserId(null);
      (window as any).amplitude.regenerateDeviceId();
    }
  }
}

// Default configuration
const defaultConfig: AnalyticsConfig = {
  enabled: import.meta.env.PROD, // Only in production
  debug: import.meta.env.DEV, // Debug in development
  providers: {
    // Configure your analytics providers here
    // googleAnalytics: {
    //   measurementId: 'G-XXXXXXXXXX'
    // },
    // plausible: {
    //   domain: 'yourdomain.com'
    // }
  }
};

// Singleton instance
export const analytics = new AnalyticsManager(defaultConfig);

/**
 * Common event tracking helpers
 */
export const trackEvent = {
  // User actions
  signup: (method: string) => analytics.track('signup', { method }),
  login: (method: string) => analytics.track('login', { method }),
  logout: () => analytics.track('logout'),
  
  // Task actions
  taskCreated: (priority?: string) => analytics.track('task_created', { priority }),
  taskCompleted: (taskId: string) => analytics.track('task_completed', { task_id: taskId }),
  taskDeleted: (taskId: string) => analytics.track('task_deleted', { task_id: taskId }),
  
  // Goal actions
  goalCreated: (goalCode: string) => analytics.track('goal_created', { goal_code: goalCode }),
  goalUpdated: (goalCode: string) => analytics.track('goal_updated', { goal_code: goalCode }),
  goalCompleted: (goalCode: string) => analytics.track('goal_completed', { goal_code: goalCode }),
  
  // Community actions
  postCreated: () => analytics.track('post_created'),
  postLiked: (postId: string) => analytics.track('post_liked', { post_id: postId }),
  commentCreated: (postId: string) => analytics.track('comment_created', { post_id: postId }),
  
  // Feature usage
  exportData: (format: string) => analytics.track('data_exported', { format }),
  searchUsed: (query: string) => analytics.track('search_used', { query }),
  filterApplied: (filters: string[]) => analytics.track('filter_applied', { filters }),
  
  // Performance
  performanceMetric: (metric: string, value: number) => 
    analytics.track('performance_metric', { metric, value }),
  
  // Errors
  error: (error: string, context?: string) => 
    analytics.track('error', { error, context }),
};

export default analytics;

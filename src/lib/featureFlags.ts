/**
 * Feature Flags System
 * 
 * Control feature rollout and A/B testing
 * Allows enabling/disabling features without code deployment
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100
  enabledForUsers?: string[]; // User IDs
  enabledForRoles?: string[]; // User roles
  expiresAt?: Date;
}

export interface FeatureFlagsConfig {
  flags: Record<string, FeatureFlag>;
  defaultEnabled: boolean;
}

class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private userId: string | null = null;
  private userRole: string | null = null;
  private defaultEnabled: boolean = false;

  constructor(config: FeatureFlagsConfig) {
    this.defaultEnabled = config.defaultEnabled;
    Object.entries(config.flags).forEach(([key, flag]) => {
      this.flags.set(key, flag);
    });
  }

  /**
   * Set current user context
   */
  setUser(userId: string, role?: string): void {
    this.userId = userId;
    this.userRole = role || null;
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);

    // Flag doesn't exist
    if (!flag) {
      return this.defaultEnabled;
    }

    // Flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check expiration
    if (flag.expiresAt && new Date() > flag.expiresAt) {
      return false;
    }

    // Check user-specific enablement
    if (flag.enabledForUsers && this.userId) {
      return flag.enabledForUsers.includes(this.userId);
    }

    // Check role-specific enablement
    if (flag.enabledForRoles && this.userRole) {
      return flag.enabledForRoles.includes(this.userRole);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      return this.isInRollout(flagKey, flag.rolloutPercentage);
    }

    // Default to flag's enabled state
    return flag.enabled;
  }

  /**
   * Check if user is in rollout percentage
   */
  private isInRollout(flagKey: string, percentage: number): boolean {
    if (!this.userId) {
      return false;
    }

    // Deterministic hash based on user ID and flag key
    const hash = this.hashString(`${this.userId}-${flagKey}`);
    const bucket = hash % 100;
    
    return bucket < percentage;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get all enabled flags
   */
  getEnabledFlags(): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key));
  }

  /**
   * Get flag details
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Update flag
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      this.flags.set(flagKey, { ...flag, ...updates });
    }
  }

  /**
   * Add new flag
   */
  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  /**
   * Remove flag
   */
  removeFlag(flagKey: string): void {
    this.flags.delete(flagKey);
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
}

/**
 * Feature flags configuration
 */
const featureFlagsConfig: FeatureFlagsConfig = {
  defaultEnabled: false,
  flags: {
    // New features
    'ai-summary': {
      key: 'ai-summary',
      enabled: true,
      description: 'AI-powered weekly summary generation',
      rolloutPercentage: 100
    },
    'task-dependencies': {
      key: 'task-dependencies',
      enabled: true,
      description: 'Task dependency tracking',
      rolloutPercentage: 100
    },
    'recurring-tasks': {
      key: 'recurring-tasks',
      enabled: true,
      description: 'Recurring task management',
      rolloutPercentage: 100
    },
    'bulk-operations': {
      key: 'bulk-operations',
      enabled: true,
      description: 'Bulk task operations',
      rolloutPercentage: 100
    },
    'notifications': {
      key: 'notifications',
      enabled: true,
      description: 'Real-time notifications',
      rolloutPercentage: 100
    },
    
    // Experimental features
    'dark-mode': {
      key: 'dark-mode',
      enabled: false,
      description: 'Dark mode theme',
      rolloutPercentage: 0
    },
    'voice-commands': {
      key: 'voice-commands',
      enabled: false,
      description: 'Voice command support',
      rolloutPercentage: 0
    },
    'ai-task-suggestions': {
      key: 'ai-task-suggestions',
      enabled: false,
      description: 'AI-powered task suggestions',
      rolloutPercentage: 10 // 10% rollout
    },
    'collaborative-goals': {
      key: 'collaborative-goals',
      enabled: false,
      description: 'Shared goals with team members',
      rolloutPercentage: 0
    },
    
    // Beta features
    'advanced-analytics': {
      key: 'advanced-analytics',
      enabled: false,
      description: 'Advanced analytics dashboard',
      rolloutPercentage: 25 // 25% rollout
    },
    'custom-themes': {
      key: 'custom-themes',
      enabled: false,
      description: 'Custom color themes',
      rolloutPercentage: 50 // 50% rollout
    },
    
    // Admin features
    'admin-panel': {
      key: 'admin-panel',
      enabled: true,
      description: 'Admin control panel',
      enabledForRoles: ['admin', 'moderator']
    },
    'user-management': {
      key: 'user-management',
      enabled: true,
      description: 'User management tools',
      enabledForRoles: ['admin']
    },
    
    // Performance features
    'lazy-loading': {
      key: 'lazy-loading',
      enabled: true,
      description: 'Lazy load components',
      rolloutPercentage: 100
    },
    'optimistic-updates': {
      key: 'optimistic-updates',
      enabled: true,
      description: 'Optimistic UI updates',
      rolloutPercentage: 100
    },
    'redis-cache': {
      key: 'redis-cache',
      enabled: false,
      description: 'Redis caching layer',
      rolloutPercentage: 0
    }
  }
};

// Singleton instance
export const featureFlags = new FeatureFlagsManager(featureFlagsConfig);

/**
 * React hook for feature flags
 */
export function useFeatureFlag(flagKey: string): boolean {
  return featureFlags.isEnabled(flagKey);
}

/**
 * HOC for conditional rendering based on feature flag
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return (props: P) => {
    const isEnabled = featureFlags.isEnabled(flagKey);
    
    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Feature flag component
 */
export function FeatureFlag({
  flag,
  children,
  fallback
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = featureFlags.isEnabled(flag);
  
  if (!isEnabled) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

/**
 * Setup instructions
 */
export const setupInstructions = `
FEATURE FLAGS SETUP INSTRUCTIONS:

1. Basic Usage:
   
   // Check if feature is enabled
   if (featureFlags.isEnabled('ai-summary')) {
     // Show AI summary feature
   }

2. React Hook:
   
   function MyComponent() {
     const hasAiSummary = useFeatureFlag('ai-summary');
     
     return hasAiSummary ? <AiSummary /> : null;
   }

3. Component Wrapper:
   
   <FeatureFlag flag="ai-summary">
     <AiSummary />
   </FeatureFlag>

4. HOC:
   
   const AiSummaryWithFlag = withFeatureFlag(
     AiSummary,
     'ai-summary',
     PlaceholderComponent
   );

5. Set User Context:
   
   featureFlags.setUser(userId, userRole);

6. Update Flags Dynamically:
   
   featureFlags.updateFlag('ai-summary', {
     enabled: true,
     rolloutPercentage: 50
   });

7. Remote Configuration:
   
   // Fetch flags from API
   const response = await fetch('/api/feature-flags');
   const flags = await response.json();
   
   flags.forEach(flag => {
     featureFlags.updateFlag(flag.key, flag);
   });

8. A/B Testing:
   
   // 50% of users see new feature
   featureFlags.updateFlag('new-feature', {
     enabled: true,
     rolloutPercentage: 50
   });

9. Beta Testing:
   
   // Enable for specific users
   featureFlags.updateFlag('beta-feature', {
     enabled: true,
     enabledForUsers: ['user1', 'user2', 'user3']
   });

10. Role-Based Features:
    
    // Enable for admins only
    featureFlags.updateFlag('admin-panel', {
      enabled: true,
      enabledForRoles: ['admin']
    });

11. Time-Limited Features:
    
    // Feature expires after date
    featureFlags.updateFlag('holiday-theme', {
      enabled: true,
      expiresAt: new Date('2024-12-31')
    });

12. Integration with Analytics:
    
    if (featureFlags.isEnabled('new-feature')) {
      analytics.track('feature_enabled', {
        feature: 'new-feature'
      });
    }
`;

export default featureFlags;

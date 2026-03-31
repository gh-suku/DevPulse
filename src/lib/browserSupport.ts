/**
 * Browser Support Detection
 * 
 * Detect browser capabilities and show warnings for unsupported browsers
 * Related to Issue #73: Browser Compatibility
 */

export interface BrowserInfo {
  name: string;
  version: string;
  supported: boolean;
  tier: 'tier1' | 'tier2' | 'tier3' | 'unsupported';
}

/**
 * Check if browser supports all required features
 */
export function isBrowserSupported(): boolean {
  const requiredFeatures = [
    // Core JavaScript features
    'fetch' in window,
    'Promise' in window,
    'localStorage' in window,
    'sessionStorage' in window,
    
    // Modern JavaScript
    typeof Symbol !== 'undefined',
    typeof Map !== 'undefined',
    typeof Set !== 'undefined',
    
    // CSS features
    CSS.supports('display', 'grid'),
    CSS.supports('display', 'flex'),
    CSS.supports('gap', '1rem'),
    
    // Optional but recommended
    'IntersectionObserver' in window,
    'ResizeObserver' in window,
  ];

  return requiredFeatures.every(feature => feature);
}

/**
 * Get detailed browser information
 */
export function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '0';
  let supported = true;
  let tier: 'tier1' | 'tier2' | 'tier3' | 'unsupported' = 'tier3';

  // Chrome
  if (ua.includes('Chrome') && !ua.includes('Edge')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
    const versionNum = parseInt(version);
    
    if (versionNum >= 90) tier = 'tier1';
    else if (versionNum >= 80) tier = 'tier2';
    else if (versionNum >= 70) tier = 'tier3';
    else {
      supported = false;
      tier = 'unsupported';
    }
  }
  // Firefox
  else if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '0';
    const versionNum = parseInt(version);
    
    if (versionNum >= 88) tier = 'tier1';
    else if (versionNum >= 78) tier = 'tier2';
    else if (versionNum >= 68) tier = 'tier3';
    else {
      supported = false;
      tier = 'unsupported';
    }
  }
  // Safari
  else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : '0';
    const versionNum = parseInt(version);
    
    if (versionNum >= 14) tier = 'tier1';
    else if (versionNum >= 13) tier = 'tier2';
    else if (versionNum >= 12) tier = 'tier3';
    else {
      supported = false;
      tier = 'unsupported';
    }
  }
  // Edge
  else if (ua.includes('Edg')) {
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : '0';
    const versionNum = parseInt(version);
    
    if (versionNum >= 90) tier = 'tier1';
    else if (versionNum >= 80) tier = 'tier2';
    else {
      supported = false;
      tier = 'unsupported';
    }
  }
  // Internet Explorer
  else if (ua.includes('MSIE') || ua.includes('Trident')) {
    name = 'Internet Explorer';
    supported = false;
    tier = 'unsupported';
  }
  // Opera
  else if (ua.includes('OPR') || ua.includes('Opera')) {
    name = 'Opera';
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/);
    version = match ? match[1] : '0';
    tier = 'tier3';
  }
  // Samsung Internet
  else if (ua.includes('SamsungBrowser')) {
    name = 'Samsung Internet';
    const match = ua.match(/SamsungBrowser\/(\d+)/);
    version = match ? match[1] : '0';
    const versionNum = parseInt(version);
    tier = versionNum >= 14 ? 'tier2' : 'tier3';
  }

  return { name, version, supported, tier };
}

/**
 * Check for specific feature support
 */
export const featureSupport = {
  serviceWorker: 'serviceWorker' in navigator,
  notifications: 'Notification' in window,
  geolocation: 'geolocation' in navigator,
  webGL: (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  })(),
  webRTC: 'RTCPeerConnection' in window,
  webSockets: 'WebSocket' in window,
  indexedDB: 'indexedDB' in window,
  webWorkers: 'Worker' in window,
  crypto: 'crypto' in window && 'subtle' in window.crypto,
  clipboard: 'clipboard' in navigator,
  share: 'share' in navigator,
  vibrate: 'vibrate' in navigator,
  battery: 'getBattery' in navigator,
  mediaDevices: 'mediaDevices' in navigator,
  
  // CSS features
  cssGrid: CSS.supports('display', 'grid'),
  cssFlexbox: CSS.supports('display', 'flex'),
  cssVariables: CSS.supports('--test', '0'),
  cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
  cssGap: CSS.supports('gap', '1rem'),
  cssAspectRatio: CSS.supports('aspect-ratio', '16/9'),
  cssContainerQueries: CSS.supports('container-type', 'inline-size'),
};

/**
 * Get missing features for current browser
 */
export function getMissingFeatures(): string[] {
  const missing: string[] = [];
  
  if (!featureSupport.serviceWorker) missing.push('Service Workers');
  if (!featureSupport.notifications) missing.push('Notifications');
  if (!featureSupport.cssGrid) missing.push('CSS Grid');
  if (!featureSupport.cssFlexbox) missing.push('CSS Flexbox');
  if (!featureSupport.cssVariables) missing.push('CSS Variables');
  if (!featureSupport.indexedDB) missing.push('IndexedDB');
  
  return missing;
}

/**
 * Get browser capabilities summary
 */
export function getBrowserCapabilities() {
  const info = getBrowserInfo();
  const missing = getMissingFeatures();
  const supported = isBrowserSupported();
  
  return {
    browser: info,
    features: featureSupport,
    missingFeatures: missing,
    isSupported: supported,
    recommendation: getRecommendation(info, supported)
  };
}

/**
 * Get recommendation based on browser support
 */
function getRecommendation(info: BrowserInfo, supported: boolean): string {
  if (!supported) {
    return `${info.name} ${info.version} is not supported. Please upgrade to a modern browser.`;
  }
  
  if (info.tier === 'tier1') {
    return 'Your browser is fully supported with all features.';
  }
  
  if (info.tier === 'tier2') {
    return 'Your browser is supported, but some features may not work optimally.';
  }
  
  if (info.tier === 'tier3') {
    return 'Your browser has limited support. Consider upgrading for the best experience.';
  }
  
  return 'Browser support unknown. Some features may not work correctly.';
}

/**
 * Log browser information to console
 */
export function logBrowserInfo(): void {
  const capabilities = getBrowserCapabilities();
  
  console.group('🌐 Browser Information');
  console.log('Browser:', capabilities.browser.name, capabilities.browser.version);
  console.log('Support Tier:', capabilities.browser.tier);
  console.log('Fully Supported:', capabilities.isSupported);
  console.log('Recommendation:', capabilities.recommendation);
  
  if (capabilities.missingFeatures.length > 0) {
    console.warn('Missing Features:', capabilities.missingFeatures);
  }
  
  console.groupEnd();
}

/**
 * Show browser warning if unsupported
 */
export function shouldShowBrowserWarning(): boolean {
  const info = getBrowserInfo();
  return !info.supported || info.tier === 'unsupported';
}

/**
 * Get supported browsers list
 */
export const supportedBrowsers = {
  tier1: [
    'Chrome 90+',
    'Firefox 88+',
    'Safari 14+',
    'Edge 90+'
  ],
  tier2: [
    'Chrome 80-89',
    'Firefox 78-87',
    'Safari 13',
    'Edge 80-89',
    'Samsung Internet 14+'
  ],
  tier3: [
    'Opera 76+',
    'Brave 1.20+',
    'Vivaldi 3.7+'
  ]
};

export default {
  isBrowserSupported,
  getBrowserInfo,
  getBrowserCapabilities,
  featureSupport,
  getMissingFeatures,
  logBrowserInfo,
  shouldShowBrowserWarning,
  supportedBrowsers
};

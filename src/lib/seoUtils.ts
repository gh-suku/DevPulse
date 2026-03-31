/**
 * SEO Utilities
 * 
 * Helper functions for improving search engine optimization
 * Manage meta tags, structured data, and social sharing
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Update document title
 */
export function updateTitle(title: string, siteName: string = 'DevPulse AI'): void {
  document.title = `${title} | ${siteName}`;
}

/**
 * Update meta tags
 */
export function updateMetaTags(metadata: SEOMetadata): void {
  const { title, description, keywords, author, image, url, type } = metadata;

  // Basic meta tags
  setMetaTag('description', description);
  if (keywords) setMetaTag('keywords', keywords.join(', '));
  if (author) setMetaTag('author', author);

  // Open Graph tags (Facebook, LinkedIn)
  setMetaTag('og:title', title, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:type', type || 'website', 'property');
  if (image) setMetaTag('og:image', image, 'property');
  if (url) setMetaTag('og:url', url, 'property');

  // Twitter Card tags
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
  if (image) setMetaTag('twitter:image', image);

  // Article-specific tags
  if (type === 'article') {
    if (metadata.publishedTime) {
      setMetaTag('article:published_time', metadata.publishedTime, 'property');
    }
    if (metadata.modifiedTime) {
      setMetaTag('article:modified_time', metadata.modifiedTime, 'property');
    }
    if (metadata.section) {
      setMetaTag('article:section', metadata.section, 'property');
    }
    if (metadata.tags) {
      metadata.tags.forEach(tag => {
        setMetaTag('article:tag', tag, 'property');
      });
    }
  }
}

/**
 * Set or update a meta tag
 */
function setMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name'): void {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Generate structured data (JSON-LD)
 */
export function generateStructuredData(type: string, data: any): void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  });
  
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(script);
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbs(items: Array<{ name: string; url: string }>): void {
  generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });
}

/**
 * Generate organization structured data
 */
export function generateOrganizationData(data: {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}): void {
  generateStructuredData('Organization', data);
}

/**
 * Generate person structured data
 */
export function generatePersonData(data: {
  name: string;
  url: string;
  image: string;
  jobTitle?: string;
  description?: string;
}): void {
  generateStructuredData('Person', data);
}

/**
 * Generate article structured data
 */
export function generateArticleData(data: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    url: string;
  };
}): void {
  generateStructuredData('Article', {
    ...data,
    author: {
      '@type': 'Person',
      ...data.author
    }
  });
}

/**
 * Update canonical URL
 */
export function updateCanonicalUrl(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
}

/**
 * Add alternate language links
 */
export function addAlternateLanguages(languages: Array<{ lang: string; url: string }>): void {
  // Remove existing alternate links
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  
  // Add new alternate links
  languages.forEach(({ lang, url }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Generate sitemap entry
 */
export function generateSitemapEntry(url: string, priority: number = 0.5, changefreq: string = 'weekly'): string {
  return `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}

# Disallow admin pages
User-agent: *
Disallow: /admin/

# Disallow API endpoints
User-agent: *
Disallow: /api/`;
}

/**
 * SEO best practices checklist
 */
export const seoBestPractices = {
  technical: [
    'Use semantic HTML elements',
    'Implement proper heading hierarchy (h1-h6)',
    'Add alt text to all images',
    'Use descriptive URLs',
    'Implement canonical URLs',
    'Add structured data (JSON-LD)',
    'Create XML sitemap',
    'Configure robots.txt',
    'Implement HTTPS',
    'Optimize page load speed'
  ],
  content: [
    'Write unique, descriptive titles (50-60 characters)',
    'Write compelling meta descriptions (150-160 characters)',
    'Use keywords naturally in content',
    'Create high-quality, original content',
    'Use internal linking',
    'Optimize images (size, format, alt text)',
    'Use descriptive anchor text',
    'Keep URLs short and descriptive',
    'Update content regularly',
    'Make content mobile-friendly'
  ],
  social: [
    'Add Open Graph tags',
    'Add Twitter Card tags',
    'Use high-quality social images (1200x630px)',
    'Write engaging social descriptions',
    'Add social sharing buttons',
    'Claim social media profiles',
    'Link to social profiles',
    'Encourage social sharing'
  ]
};

/**
 * Page-specific SEO configurations
 */
export const pageSEO = {
  home: {
    title: 'DevPulse AI - Activity Tracking & Productivity',
    description: 'Track your daily activities, manage tasks, and achieve your goals with DevPulse AI. Boost productivity with AI-powered insights and analytics.',
    keywords: ['productivity', 'task management', 'goal tracking', 'activity tracker', 'AI insights']
  },
  dashboard: {
    title: 'Dashboard',
    description: 'View your productivity dashboard with tasks, goals, and daily activities.'
  },
  tasks: {
    title: 'Tasks',
    description: 'Manage your tasks with priorities, due dates, and subtasks.'
  },
  goals: {
    title: 'Goals',
    description: 'Track your goals and monitor progress towards your targets.'
  },
  insights: {
    title: 'Insights',
    description: 'Get AI-powered insights and analytics about your productivity.'
  },
  community: {
    title: 'Community',
    description: 'Connect with other users, share achievements, and get inspired.'
  },
  profile: {
    title: 'Profile',
    description: 'Manage your profile, settings, and preferences.'
  },
  leaderboard: {
    title: 'Leaderboard',
    description: 'See top performers and compete with other users.'
  }
};

/**
 * Initialize SEO for a page
 */
export function initPageSEO(page: keyof typeof pageSEO, customMetadata?: Partial<SEOMetadata>): void {
  const seoConfig = pageSEO[page];
  const baseUrl = window.location.origin;
  const currentUrl = window.location.href;

  const metadata: SEOMetadata = {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    url: currentUrl,
    image: `${baseUrl}/og-image.png`,
    type: 'website',
    ...customMetadata
  };

  updateTitle(metadata.title);
  updateMetaTags(metadata);
  updateCanonicalUrl(currentUrl);
}

export default {
  updateTitle,
  updateMetaTags,
  generateStructuredData,
  generateBreadcrumbs,
  generateOrganizationData,
  generatePersonData,
  generateArticleData,
  updateCanonicalUrl,
  addAlternateLanguages,
  generateSitemapEntry,
  generateRobotsTxt,
  initPageSEO,
  pageSEO,
  seoBestPractices
};

/**
 * Security Headers Configuration
 * 
 * Recommended security headers for production deployment
 * Helps protect against common web vulnerabilities
 */

export const securityHeaders = {
  /**
   * Content Security Policy (CSP)
   * Prevents XSS attacks by controlling which resources can be loaded
   */
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://plausible.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),

  /**
   * X-Frame-Options
   * Prevents clickjacking attacks
   */
  'X-Frame-Options': 'DENY',

  /**
   * X-Content-Type-Options
   * Prevents MIME type sniffing
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * X-XSS-Protection
   * Enables browser XSS protection (legacy, CSP is preferred)
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Referrer-Policy
   * Controls how much referrer information is sent
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Permissions-Policy
   * Controls which browser features can be used
   */
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()'
  ].join(', '),

  /**
   * Strict-Transport-Security (HSTS)
   * Forces HTTPS connections
   */
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  /**
   * X-Permitted-Cross-Domain-Policies
   * Restricts Adobe Flash and PDF cross-domain requests
   */
  'X-Permitted-Cross-Domain-Policies': 'none',

  /**
   * Cross-Origin-Embedder-Policy
   * Prevents loading cross-origin resources
   */
  'Cross-Origin-Embedder-Policy': 'require-corp',

  /**
   * Cross-Origin-Opener-Policy
   * Isolates browsing context
   */
  'Cross-Origin-Opener-Policy': 'same-origin',

  /**
   * Cross-Origin-Resource-Policy
   * Protects against cross-origin attacks
   */
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Netlify _headers file configuration
 */
export const netlifyHeaders = `
/*
  Content-Security-Policy: ${securityHeaders['Content-Security-Policy']}
  X-Frame-Options: ${securityHeaders['X-Frame-Options']}
  X-Content-Type-Options: ${securityHeaders['X-Content-Type-Options']}
  X-XSS-Protection: ${securityHeaders['X-XSS-Protection']}
  Referrer-Policy: ${securityHeaders['Referrer-Policy']}
  Permissions-Policy: ${securityHeaders['Permissions-Policy']}
  Strict-Transport-Security: ${securityHeaders['Strict-Transport-Security']}
  X-Permitted-Cross-Domain-Policies: ${securityHeaders['X-Permitted-Cross-Domain-Policies']}

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Don't cache HTML
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Service worker
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
`;

/**
 * Vercel vercel.json headers configuration
 */
export const vercelHeaders = {
  headers: [
    {
      source: '/(.*)',
      headers: Object.entries(securityHeaders).map(([key, value]) => ({
        key,
        value
      }))
    },
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
    {
      source: '/:path*.html',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate'
        }
      ]
    }
  ]
};

/**
 * Cloudflare Workers headers
 */
export const cloudflareWorkersHeaders = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  // Add security headers
  ${Object.entries(securityHeaders).map(([key, value]) => 
    `newResponse.headers.set('${key}', '${value}')`
  ).join('\n  ')}
  
  return newResponse
}
`;

/**
 * Apache .htaccess configuration
 */
export const apacheHeaders = `
<IfModule mod_headers.c>
  ${Object.entries(securityHeaders).map(([key, value]) => 
    `Header always set ${key} "${value}"`
  ).join('\n  ')}
</IfModule>

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Don't cache HTML
<FilesMatch "\\.html$">
  Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
`;

/**
 * Nginx configuration
 */
export const nginxHeaders = `
# Security headers
${Object.entries(securityHeaders).map(([key, value]) => 
  `add_header ${key} "${value}" always;`
).join('\n')}

# Cache static assets
location ~* \\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Don't cache HTML
location ~* \\.html$ {
  expires 0;
  add_header Cache-Control "public, max-age=0, must-revalidate";
}
`;

/**
 * Setup instructions
 */
export const setupInstructions = `
SECURITY HEADERS SETUP INSTRUCTIONS:

1. Choose your deployment platform:

   A. Netlify:
      - Create a file: public/_headers
      - Copy content from netlifyHeaders
      - Deploy

   B. Vercel:
      - Add to vercel.json
      - Copy content from vercelHeaders
      - Deploy

   C. Cloudflare Workers:
      - Create worker script
      - Copy content from cloudflareWorkersHeaders
      - Deploy

   D. Apache:
      - Create/edit .htaccess
      - Copy content from apacheHeaders
      - Restart Apache

   E. Nginx:
      - Edit nginx.conf or site config
      - Copy content from nginxHeaders
      - Reload Nginx: sudo nginx -s reload

2. Test security headers:
   - Visit: https://securityheaders.com
   - Enter your domain
   - Check for A+ rating

3. Common issues:
   - CSP blocking resources: Add domains to CSP
   - CORS errors: Configure CORS separately
   - Mixed content: Ensure all resources use HTTPS

4. Monitoring:
   - Set up CSP reporting
   - Monitor browser console for violations
   - Use report-uri.com for CSP reports

5. Maintenance:
   - Review headers quarterly
   - Update CSP as you add new services
   - Test after any infrastructure changes
`;

export default {
  securityHeaders,
  netlifyHeaders,
  vercelHeaders,
  cloudflareWorkersHeaders,
  apacheHeaders,
  nginxHeaders,
  setupInstructions
};

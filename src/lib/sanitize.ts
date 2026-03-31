// Input sanitization utilities to prevent XSS attacks

/**
 * Sanitize user input by escaping HTML special characters
 * This prevents XSS attacks by converting potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize HTML content for display
 * Strips all HTML tags except safe ones
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Truncate text to prevent overflow attacks
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}

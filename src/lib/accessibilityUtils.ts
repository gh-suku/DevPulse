/**
 * Accessibility Utilities
 * 
 * Helper functions and hooks for improving accessibility
 * WCAG 2.1 Level AA compliance utilities
 */

import { useEffect, useRef } from 'react';

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check color contrast ratio
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  // Convert to sRGB
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate accessible label for form field
 */
export function generateAriaLabel(
  fieldName: string,
  isRequired: boolean = false,
  error?: string
): string {
  let label = fieldName;
  
  if (isRequired) {
    label += ', required';
  }
  
  if (error) {
    label += `, error: ${error}`;
  }
  
  return label;
}

/**
 * Focus trap for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Manage focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    previousFocusRef.current?.focus();
  };

  return { saveFocus, restoreFocus };
}

/**
 * Skip to main content link
 */
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded"
    >
      Skip to main content
    </a>
  );
}

/**
 * Keyboard navigation helper
 */
export function useKeyboardNavigation(
  items: any[],
  onSelect: (item: any) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[selectedIndex]);
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIndex(items.length - 1);
        break;
    }
  };

  return { selectedIndex, handleKeyDown };
}

/**
 * ARIA live region hook
 */
export function useAriaLiveRegion() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (msg: string, prio: 'polite' | 'assertive' = 'polite') => {
    setMessage(msg);
    setPriority(prio);
    
    // Clear after announcement
    setTimeout(() => setMessage(''), 1000);
  };

  const LiveRegion = () => (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );

  return { announce, LiveRegion };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Accessible button props
 */
export function getAccessibleButtonProps(
  label: string,
  isDisabled: boolean = false,
  isPressed?: boolean
) {
  return {
    'aria-label': label,
    'aria-disabled': isDisabled,
    'aria-pressed': isPressed,
    role: 'button',
    tabIndex: isDisabled ? -1 : 0
  };
}

/**
 * Accessible form field props
 */
export function getAccessibleFieldProps(
  id: string,
  label: string,
  isRequired: boolean = false,
  error?: string,
  description?: string
) {
  return {
    id,
    'aria-label': label,
    'aria-required': isRequired,
    'aria-invalid': !!error,
    'aria-describedby': [
      description ? `${id}-description` : null,
      error ? `${id}-error` : null
    ].filter(Boolean).join(' ') || undefined
  };
}

/**
 * Accessibility checklist
 */
export const accessibilityChecklist = {
  keyboard: [
    'All interactive elements are keyboard accessible',
    'Tab order is logical',
    'Focus indicators are visible',
    'No keyboard traps',
    'Skip links are provided'
  ],
  screenReader: [
    'All images have alt text',
    'Form fields have labels',
    'ARIA labels are descriptive',
    'Live regions announce updates',
    'Headings are hierarchical'
  ],
  visual: [
    'Color contrast meets WCAG AA (4.5:1)',
    'Text is resizable to 200%',
    'No information conveyed by color alone',
    'Focus indicators are visible',
    'Touch targets are at least 44x44px'
  ],
  content: [
    'Language is set on html element',
    'Page titles are descriptive',
    'Headings describe content',
    'Link text is descriptive',
    'Error messages are clear'
  ],
  forms: [
    'Labels are associated with inputs',
    'Required fields are indicated',
    'Error messages are descriptive',
    'Success messages are announced',
    'Validation is accessible'
  ]
};

export default {
  announceToScreenReader,
  getContrastRatio,
  meetsContrastRequirements,
  generateAriaLabel,
  useFocusTrap,
  useFocusRestore,
  useKeyboardNavigation,
  useAriaLiveRegion,
  prefersReducedMotion,
  getAccessibleButtonProps,
  getAccessibleFieldProps,
  SkipToMainContent,
  accessibilityChecklist
};

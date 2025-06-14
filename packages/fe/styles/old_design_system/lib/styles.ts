// =============================================================================
// STYLES UTILITIES - TypeScript Helpers
// =============================================================================

/**
 * Design system utilities and constants
 */

// CSS Custom Property Helpers
export const cssVars = {
  // Colors
  brand: {
    primary: 'var(--color-brand-primary)',
    secondary: 'var(--color-brand-secondary)',
    dark: 'var(--color-brand-dark)',
    light: 'var(--color-brand-light)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
  },
  background: {
    light: 'var(--color-background-light)',
    surface: 'var(--color-background-surface)',
    overlay: 'var(--color-background-overlay)',
  },
  // Spacing
  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
    '3xl': 'var(--spacing-3xl)',
  },
  // Typography
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
  },
  // Border radius
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
} as const;

/**
 * Breakpoint utilities for responsive design
 */
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Media query helpers
 */
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;

/**
 * Helper function to generate CSS custom properties
 */
export function createCSSVar(name: string, fallback?: string): string {
  return fallback ? `var(--${name}, ${fallback})` : `var(--${name})`;
}

/**
 * Helper function to generate responsive classes
 */
export function responsive(base: string, variants: Record<string, string>): string {
  const classes = [base];
  
  Object.entries(variants).forEach(([breakpoint, variant]) => {
    if (breakpoint in breakpoints) {
      classes.push(`${breakpoint}:${variant}`);
    }
  });
  
  return classes.join(' ');
}

/**
 * Utility function for conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// =============================================================================
// STYLES LIBRARY
// Main styles export for TypeScript/JavaScript consumption
// =============================================================================

// Export CSS file paths for consumption by bundlers
export const baseStyles = '../base-styles.scss';
export const designTokens = '../design-tokens.scss';
export const utils = '../utils.scss';
export const utility = '../utility.scss';
export const themes = '../themes.scss';

// Foundation paths
export const foundations = {
  colors: '../foundations/_colors.scss',
  typography: '../foundations/_typography.scss',
  spacing: '../foundations/_spacing.scss',
  breakpoints: '../foundations/_breakpoints.scss',
  elevation: '../foundations/_elevation.scss',
  transitions: '../foundations/_transitions.scss',
  openProps: '../foundations/_open-props.scss',
};

// Utility paths
export const utilities = {
  backgrounds: '../utilities/_backgrounds.scss',
  colors: '../utilities/_colors.scss',
  display: '../utilities/_display.scss',
  responsive: '../utilities/_responsive.scss',
  spacing: '../utilities/_spacing.scss',
  typography: '../utilities/_typography.scss',
};

// All SCSS imports as a single object
export const scssFiles = {
  baseStyles,
  designTokens,
  utils,
  utility,
  themes,
  foundations,
  utilities,
};

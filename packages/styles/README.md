# @mono/styles

A premium design system and SCSS library for luxury frontend applications. Built on top of [Open Props](https://open-props.style) with custom extensions for elevated user experiences.

## Features

- 🎨 **Premium Design Tokens** - Carefully crafted color palettes, typography scales, and spacing systems
- 📱 **Responsive Design** - Mobile-first approach with luxury-focused breakpoints
- 🎭 **Component Styles** - Beautiful base styles for buttons, forms, cards, and more
- 🏗️ **Layout Systems** - Flexible grid and flexbox utilities
- 🔧 **Utility Classes** - Comprehensive utility system for rapid development
- ⚡ **Vite Optimized** - Built specifically for Vite bundler with fast HMR
- 🔄 **Nx Compatible** - Seamlessly integrates with Nx monorepo workflows

## Installation

This package is part of the monorepo and is automatically available to other workspace packages. For external projects:

```bash
npm install @mono/styles
```

## Usage

### Method 1: Import Base Styles (Recommended)

Import the complete design system in your app's main SCSS file:

```scss
// In your main.scss or app.scss
@use '@mono/styles/scss' as styles;

// Or import directly
@import '@mono/styles/scss';
```

### Method 2: Selective Imports

Import specific modules as needed:

```scss
// Import only foundations (tokens)
@use '@mono/styles/scss/foundations' as *;

// Import specific components
@use '@mono/styles/scss/components/button' as *;
@use '@mono/styles/scss/components/card' as *;

// Import utilities
@use '@mono/styles/scss/utilities' as *;
```

### Method 3: Individual Token Files

Access specific design token files:

```scss
// Colors only
@use '@mono/styles/scss/foundations/colors' as *;

// Typography tokens
@use '@mono/styles/scss/foundations/typography' as *;

// Spacing system
@use '@mono/styles/scss/foundations/spacing' as *;
```

## Architecture

```
src/
├── base-styles.scss          # Main entry point with global styles
├── foundations/              # Design tokens and core variables
│   ├── _index.scss          # Foundation exports
│   ├── open-props.scss      # Open Props integration
│   ├── colors.scss          # Color palette and semantic tokens
│   ├── typography.scss      # Font scales and text styles
│   ├── spacing.scss         # Spacing scale and layout tokens
│   ├── elevation.scss       # Shadow and depth tokens
│   ├── breakpoints.scss     # Responsive breakpoints
│   └── transitions.scss     # Animation and transition tokens
├── components/              # Component-specific styles
│   ├── _index.scss         # Component exports
│   ├── button.scss         # Button variants and states
│   ├── card.scss           # Card layouts and styles
│   ├── form.scss           # Form controls and validation
│   └── navigation.scss     # Navigation and menu styles
├── layouts/                # Layout and grid systems
│   ├── _index.scss         # Layout exports
│   ├── grid.scss           # CSS Grid utilities
│   ├── flexbox.scss        # Flexbox utilities
│   └── containers.scss     # Container and wrapper styles
└── utilities/              # Utility classes
    ├── _index.scss         # Utility exports
    ├── spacing.scss        # Margin and padding utilities
    ├── text.scss           # Typography utilities
    ├── display.scss        # Display and visibility utilities
    └── colors.scss         # Color and background utilities
```

## Design Tokens

### Colors

The color system provides semantic color tokens built on a luxury palette:

```scss
// Primary colors
--color-primary-50   // Lightest primary
--color-primary-500  // Base primary
--color-primary-950  // Darkest primary

// Semantic colors
--color-text-primary    // Primary text color
--color-text-secondary  // Secondary text color
--color-background-light // Light background
--color-background-dark  // Dark background

// Status colors
--color-success    // Success states
--color-warning    // Warning states
--color-error      // Error states
--color-info       // Information states
```

### Typography

Typography tokens for consistent text hierarchy:

```scss
// Font families
--font-family-primary    // Primary font stack
--font-family-secondary  // Secondary font stack
--font-family-mono      // Monospace font stack

// Font sizes (fluid scaling)
--font-size-xs     // 12px base
--font-size-sm     // 14px base
--font-size-base   // 16px base
--font-size-lg     // 18px base
--font-size-xl     // 20px base
--font-size-2xl    // 24px base
--font-size-3xl    // 30px base
--font-size-4xl    // 36px base

// Font weights
--font-weight-light     // 300
--font-weight-regular   // 400
--font-weight-medium    // 500
--font-weight-semibold  // 600
--font-weight-bold      // 700

// Line heights
--line-height-tight     // 1.25
--line-height-normal    // 1.5
--line-height-relaxed   // 1.75
```

### Spacing

Consistent spacing scale for layouts:

```scss
--space-0     // 0px
--space-1     // 4px
--space-2     // 8px
--space-3     // 12px
--space-4     // 16px
--space-5     // 20px
--space-6     // 24px
--space-8     // 32px
--space-10    // 40px
--space-12    // 48px
--space-16    // 64px
--space-20    // 80px
--space-24    // 96px
--space-32    // 128px
```

### Breakpoints

Mobile-first responsive breakpoints:

```scss
--breakpoint-sm: 640px    // Small devices
--breakpoint-md: 768px    // Medium devices
--breakpoint-lg: 1024px   // Large devices
--breakpoint-xl: 1280px   // Extra large devices
--breakpoint-2xl: 1536px  // 2X large devices
```

## Component Styles

### Button

```scss
.btn {
  // Base button styles
}

.btn-primary {
  // Primary button variant
}

.btn-secondary {
  // Secondary button variant
}

.btn-outline {
  // Outlined button variant
}
```

### Card

```scss
.card {
  // Base card styles with elevation
}

.card-header {
  // Card header styles
}

.card-body {
  // Card content area
}

.card-footer {
  // Card footer styles
}
```

## Utilities

Comprehensive utility classes for rapid development:

```scss
// Spacing utilities
.m-1, .m-2, .m-3, .m-4, .m-5, .m-6, .m-8, .m-10, .m-12, .m-16, .m-20, .m-24, .m-32
.p-1, .p-2, .p-3, .p-4, .p-5, .p-6, .p-8, .p-10, .p-12, .p-16, .p-20, .p-24, .p-32

// Text utilities
.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl, .text-4xl
.text-left, .text-center, .text-right
.font-light, .font-regular, .font-medium, .font-semibold, .font-bold

// Display utilities
.block, .inline-block, .inline, .flex, .grid, .hidden
.flex-col, .flex-row, .items-center, .justify-center, .justify-between

// Color utilities
.text-primary, .text-secondary, .text-muted
.bg-primary, .bg-secondary, .bg-light, .bg-dark
```

## Building

Build the library for distribution:

```bash
nx build styles
```

This will:
1. Copy all SCSS files to `dist/`
2. Generate TypeScript declarations
3. Create package.json with correct exports

## Testing

Run unit tests:

```bash
nx test styles
```

## Integration Examples

### With React + Vite

```scss
// src/styles/main.scss
@use '@mono/styles/scss' as *;

// Your custom styles here
.custom-component {
  background: var(--color-primary-500);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

### With Vue + Vite

```scss
// src/styles/index.scss
@import '@mono/styles/scss';

// Vue-specific overrides
.vue-component {
  color: var(--color-text-primary);
}
```

### With Nx React App

```scss
// apps/my-app/src/styles.scss
@use '@mono/styles/scss';

// App-specific customizations
:root {
  --color-primary-500: #custom-brand-color;
}
```

## Contributing

1. Add new design tokens to the appropriate foundation file
2. Create component styles in the `components/` directory
3. Add utility classes to the `utilities/` directory
4. Update this README with new tokens or patterns
5. Run tests to ensure everything works

## Dependencies

- **Open Props** - Design token foundation
- **Sass** - SCSS processing
- **Vite** - Build system integration

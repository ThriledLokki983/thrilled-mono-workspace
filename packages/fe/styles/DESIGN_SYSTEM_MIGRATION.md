# Design System Migration - December 2024

## Overview

The styles package has been reorganized to use the new design system structure from `base_styles`. The previous design system has been preserved in the `old_design_system` folder.

## New Structure

```
packages/fe/styles/
├── src/                          # NEW: Main design system
│   ├── index.ts                  # TypeScript entry point
│   ├── index.scss                # Main SCSS entry point
│   ├── base.scss                 # Base styles (core entry)
│   ├── components.scss           # Component styles
│   ├── design-tokens.scss        # Design tokens
│   ├── effects.scss              # Effects and animations
│   ├── themes.scss               # Theme definitions
│   ├── utils.scss                # Utility classes
│   ├── components/               # Component-specific styles
│   ├── utility/                  # Utility functions and mixins
│   ├── mixins/                   # SCSS mixins
│   ├── primer/                   # Base/primer styles
│   ├── vendor/                   # Third-party styles
│   └── lib/                      # TypeScript utilities
└── old_design_system/            # PRESERVED: Previous design system
    ├── base-styles.scss
    ├── foundations/
    ├── components/
    ├── layouts/
    ├── utilities/
    └── lib/
```

## Usage

### In your applications:

```scss
// Main stylesheet (recommended)
@import '@mono/styles/index.scss';

// Or just the base
@import '@mono/styles/base.scss';

// Or specific modules
@import '@mono/styles/components.scss';
@import '@mono/styles/effects.scss';
```

### TypeScript imports:

```typescript
import { /* utilities */ } from '@mono/styles';
```

## Key Changes

1. **Main entry point**: Now `src/index.scss` (was `src/base-styles.scss`)
2. **Structure**: Based on your `base_styles` organization
3. **Preserved**: Old design system moved to `old_design_system/`
4. **Package exports**: Updated to point to new structure

## Migration Status

- ✅ File structure reorganized
- ✅ Entry points updated
- ✅ Package.json exports configured
- ✅ Build process verified
- 🔄 Applications need to update imports
- 📋 TODO: Update component libraries to use new structure

## Next Steps

1. Update any applications currently importing from the old structure
2. Test the new design system in your applications
3. Gradually migrate components to use the new utility structure
4. Remove `old_design_system/` once migration is complete

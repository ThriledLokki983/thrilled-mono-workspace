# Button Component

The Button component is a versatile UI element that has been updated to use consistent box-shadow styling across different states, aligning with the form elements styling approach.

## Features

- Multiple variants: primary, secondary, outline, text, link, subtle, success, warning, error
- Three sizes: small, medium, large
- Support for both button and anchor (link) elements
- Consistent state styling with the form elements
- Enhanced accessibility with focus states
- Support for error states in form submissions

## Usage

```tsx
import { Button } from '@components/common/Button';

// Basic usage
<Button>Click Me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="text">Text</Button>
<Button variant="link">Link</Button>
<Button variant="subtle">Subtle</Button>

// With sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// As a link
<Button url="https://example.com">External Link</Button>

// Submit button in a form
<Button type="submit">Submit</Button>

// Disabled state
<Button disabled>Disabled</Button>

// Error state (for form buttons)
<Button error>Error</Button>
```

## Visual States

All button variants share a consistent visual language across different states:

### Default State
- Specific styling based on the variant
- No focus ring

### Hover State
- Variant-specific hover styling
- Box shadow: 0 0 0 3px var(--hover-ring-color)
- Slight transform for some variants
- Cursor: pointer

### Focus State
- Box shadow: 0 0 0 3px var(--focus-ring-color)
- No outline (replaced with box-shadow for consistency)

### Error State
- Box shadow: 0 0 0 3px var(--error-ring-color) when focused
- Useful for form submission errors

### Disabled State
- Opacity: 0.7
- Box shadow: 0 0 0 2px var(--disabled-ring-color)
- Cursor: not-allowed

## Implementation

The button styling uses CSS variables and a shared approach with form elements:

```scss
$btn-focus-ring-color: var(--color-primary-light);
$btn-error-ring-color: var(--color-error-light);
$btn-hover-ring-color: var(--color-border-hover-light);
$btn-disabled-ring-color: var(--color-surface-3);
```

## Accessibility Considerations

- Focus states are clearly visible with contrasting colors
- Error states provide visual feedback
- Hover states indicate interactive elements
- Disabled states clearly show non-interactive elements
- Maintains button/link semantics based on usage

## Integration with Form Elements

The Button component's styling is consistent with form elements, using the same box-shadow approach for various states. This creates a cohesive visual language across the entire application.

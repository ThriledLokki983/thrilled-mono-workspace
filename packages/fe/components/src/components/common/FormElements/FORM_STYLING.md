# Form Elements Styling

The form elements in this design system have been enhanced with a consistent styling approach that includes box shadows for different states. This document explains how each state is visually represented.

## Visual States

All form elements (Input, Select, TextArea) share a consistent visual language across different states:

### Default State
- Border: 1px/1.5px solid var(--color-border-primary)
- Background: var(--color-surface-1)
- No box shadow

### Hover State
- Border: var(--color-border-hover)
- Box shadow: 0 0 0 3px var(--hover-ring-color)
- Slightly lighter background (for inputs)

### Focus State
- Border: var(--color-primary)
- Box shadow: 0 0 0 3px var(--focus-ring-color)
- Primary color accents

### Error State
- Border: var(--color-error)
- No box shadow by default
- Error text displayed below

### Error + Focus State
- Border: var(--color-error)
- Box shadow: 0 0 0 3px var(--error-ring-color)

### Disabled State
- Opacity: 0.7
- Background: var(--color-surface-2)
- Box shadow: 0 0 0 2px var(--disabled-ring-color)
- Cursor: not-allowed

## Implementation

The styling is implemented through CSS variables and a shared approach:

```scss
--focus-ring-color: var(--color-primary-light);
--error-ring-color: var(--color-error-light);
--hover-ring-color: var(--color-border-hover-light, rgba(0, 0, 0, 0.08));
--disabled-ring-color: var(--color-surface-3, #f5f5f5);
```

For React Aria integration, we use data attributes to apply the appropriate styles:

```scss
[data-focus-visible] .input {
  box-shadow: 0 0 0 3px var(--focus-ring-color);
}

[data-focus-visible][data-invalid] .input {
  box-shadow: 0 0 0 3px var(--error-ring-color);
}
```

## Shared Variables

Form element styles are maintained in a shared `_form-variables.scss` file to ensure consistency across all form components.

## Accessibility Considerations

The visual states have been designed with accessibility in mind:

- Focus states are clearly visible with contrasting colors
- Error states combine color and text for multiple modes of feedback
- Hover states provide visual feedback for interactive elements
- Disabled states clearly indicate non-interactive elements

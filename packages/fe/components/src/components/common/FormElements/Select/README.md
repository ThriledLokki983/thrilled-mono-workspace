# Select Component

The Select component is built on top of React Aria's Select component to provide a fully accessible, keyboard-navigable, and customizable dropdown selection control.

## Features

- **Fully accessible** (WCAG 2.1 AA compliant)
- **Keyboard navigation** (arrow keys, typing to select)
- **Screen reader announcements**
- **Mobile-friendly** with touch support
- **Customizable styling** through CSS modules

## API

```tsx
import { Select } from 'components/common/FormElements/Select';

<Select
  label="Country"
  placeholder="Select a country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' }
  ]}
  icon={Globe}
  onChange={(e) => setValue(e.target.value)}
  value={value}
  error={error}
  helperText="Please select your country"
  size="medium"
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text for the select |
| `placeholder` | `string` | Placeholder text when no option is selected |
| `options` | `{ value: string \| number, label: string }[]` | Array of options to display |
| `value` | `string \| number` | Currently selected value |
| `onChange` | `(e: React.ChangeEvent<HTMLSelectElement>) => void` | Callback when selection changes |
| `icon` | `LucideIcon` | Optional icon to display on the left |
| `error` | `string` | Error message to display |
| `helperText` | `string` | Helper text to display below the select |
| `size` | `'small' \| 'medium' \| 'large'` | Size variant |
| `disabled` | `boolean` | Whether the select is disabled |
| `required` | `boolean` | Whether the select is required |

## Implementation Notes

This component uses React Aria Components internally for accessibility and behavior, while maintaining our custom design system styling. The implementation:

1. Maps our component API to React Aria's API
2. Uses CSS modules for styling
3. Maintains backward compatibility with the native select's onChange handler

## Accessibility Features

- Full keyboard navigation
- ARIA attributes managed automatically
- Focus management
- Screen reader announcements
- Touch support for mobile

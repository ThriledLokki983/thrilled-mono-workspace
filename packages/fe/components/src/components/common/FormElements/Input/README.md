# Input Component

The Input component is built on top of React Aria's TextField component to provide a fully accessible, customizable text input control.

## Features

- **Fully accessible** (WCAG 2.1 AA compliant)
- **Keyboard navigation**
- **Screen reader support**
- **Touch support**
- **Password visibility toggle**
- **Validation support**
- **Icon support**
- **Multiple size variants**

## API

```tsx
import { Input } from 'components/common/FormElements/Input';

<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
  icon={Mail}
  required
  onChange={(e) => setValue(e.target.value)}
  value={value}
  error={error}
  helperText="We'll never share your email"
  size="medium"
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text for the input |
| `placeholder` | `string` | Placeholder text when input is empty |
| `type` | `string` | HTML input type (text, email, password, etc.) |
| `value` | `string \| number` | Current value of the input |
| `onChange` | `(e: React.ChangeEvent<HTMLInputElement>) => void` | Callback when input value changes |
| `icon` | `LucideIcon` | Optional icon to display on the left |
| `error` | `string` | Error message to display below the input |
| `helperText` | `string` | Helper text to display below the input |
| `size` | `'small' \| 'medium' \| 'large'` | Size variant |
| `required` | `boolean` | Whether the input is required |
| `disabled` | `boolean` | Whether the input is disabled |

## Implementation Notes

This component uses React Aria Components internally for accessibility and behavior, while maintaining our custom design system styling. The implementation:

1. Provides a password visibility toggle for password inputs
2. Maps our component API to React Aria's API
3. Uses CSS modules for styling
4. Maintains backward compatibility with native inputs

## Accessibility Features

- Proper ARIA labeling
- Error message association
- Focus management
- Screen reader announcements
- Touch support for mobile devices

## CSS Customization

The Input component uses the following CSS custom properties for styling:

- `--input-height`: Controls the height of the input
- `--input-font-size`: Controls the font size
- `--focus-ring-color`: Controls the focus ring color
- `--error-ring-color`: Controls the error state ring color

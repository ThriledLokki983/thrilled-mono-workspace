# TextArea Component

The TextArea component is an enhanced version of the native `<textarea>` element with additional features and consistent styling. It uses React Aria Components internally to provide excellent accessibility support.

## Features

- Accessible by default (WCAG 2.1 compliant)
- Custom styling with design system tokens
- Support for labels, error messages, and helper text
- Character counter
- Multiple size variants
- Seamless integration with form libraries

## Usage

```tsx
import { TextArea } from './components/common/FormElements/TextArea';

function MyForm() {
  const [value, setValue] = useState('');
  
  return (
    <TextArea
      label="Description"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Enter a description..."
      helperText="Max 200 characters"
      maxLength={200}
      showCount
      required
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text for the textarea |
| `error` | `string` | - | Error message to display below the textarea |
| `helperText` | `string` | - | Helper text to display below the textarea |
| `showCount` | `boolean` | `false` | Whether to show character count |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the textarea |
| ...other props | TextareaHTMLAttributes | - | All native textarea attributes are supported |

## Accessibility

This component implements the [WAI-ARIA Textarea Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/textbox/) using React Aria Components. It includes:

- Proper labeling and descriptions
- Keyboard focus management
- Screen reader announcements for errors
- Support for ARIA attributes

## Implementation Notes

This component uses React Aria Components internally, but maintains compatibility with the existing component API through synthetic event handling.

```tsx
// Internal change handling for React Aria integration
const handleChange = (newValue: string) => {
  if (onChange) {
    const syntheticEvent = {
      target: {
        value: newValue,
        name,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(syntheticEvent);
  }
};
```

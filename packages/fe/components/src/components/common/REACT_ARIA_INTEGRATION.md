# Integrating Components with React Aria

This guide explains how to integrate components from our design system with React Aria Components for enhanced accessibility and behavior.

## Integration Pattern

The basic pattern for integrating with React Aria involves:

1. **Creating a wrapper component** that maps our API to React Aria's API
2. **Styling with our design system** through CSS modules
3. **Preserving backward compatibility** with existing code

## Example: Select Component

The Select component is a good example of this integration pattern:

```tsx
import { forwardRef } from 'react';
import type { Key } from 'react-aria-components';
import {
  Select as AriaSelect,
  SelectValue,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  Label,
} from 'react-aria-components';
import type { SelectProps } from './Select.interface';
import styles from './Select.module.scss';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (props, _ref) => {
    // Map our props to React Aria props
    const handleSelectionChange = (key: Key | null) => {
      if (props.onChange && key !== null) {
        // Create a synthetic event for backward compatibility
        const syntheticEvent = {
          target: {
            value: key.toString(),
            name: props.name
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        props.onChange(syntheticEvent);
      }
    };

    // Convert our options format to React Aria's format
    const items = props.options.map(option => ({
      id: option.value.toString(),
      textValue: option.label
    }));

    return (
      <AriaSelect
        name={props.name}
        isDisabled={props.disabled}
        selectedKey={props.value?.toString()}
        onSelectionChange={handleSelectionChange}
        className={styles.wrapper}
        data-size={props.size}
        data-has-error={!!props.error}
        data-is-disabled={props.disabled}
      >
        {/* Render using our design system styling */}
        {/* ... */}
      </AriaSelect>
    );
  }
);
```

## Example: TextArea Component

The TextArea component shows how to handle form field inputs with React Aria:

```tsx
import { forwardRef } from 'react';
import {
  TextField,
  Label,
  TextArea as AriaTextArea,
  FieldError,
  Text,
} from 'react-aria-components';
import type { TextAreaProps } from './TextArea.interface';
import styles from './TextArea.module.scss';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => {
    const charCount = props.value?.toString().length || 0;

    // Handle change event to maintain compatibility with existing code
    const handleChange = (newValue: string) => {
      if (props.onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
            name: props.name,
          },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        props.onChange(syntheticEvent);
      }
    };

    return (
      <TextField
        isRequired={props.required}
        isDisabled={props.disabled}
        isInvalid={!!props.error}
        value={props.value?.toString() || ''}
        onChange={handleChange}
        className={styles.wrapper}
        data-size={props.size}
      >
        {props.label && (
          <Label className={styles.label}>
            {props.label}
            {props.required && <span className={styles.required}>*</span>}
          </Label>
        )}
        <AriaTextArea 
          ref={ref}
          className={styles.textarea}
          {...props}
        />
        {props.error && <FieldError className={styles.error}>{props.error}</FieldError>}
      </TextField>
    );
  }
);
```

## Component Mapping Guide

| Our Component | React Aria Component | Benefits |
|---------------|---------------------|----------|
| Button | Button | Proper ARIA roles, press handling |
| Checkbox | Checkbox | Indeterminate state support |
| DatePicker | DatePicker | Full keyboard navigation, localization |
| Dialog | Dialog | Focus management, escape to close |
| DropdownMenu | Menu | Keyboard navigation, typeahead |
| Form | Form | Validation, accessible error states |
| Input | TextField | Label association, validation |
| RadioGroup | RadioGroup | Grouping, keyboard navigation |
| Select | Select + ListBox | Dropdown behavior, keyboard support |
| Slider | Slider | Keyboard incrementing, screen reader |
| Tabs | Tabs | Automatic ARIA attributes |
| TextArea | TextField + TextArea | Label association, validation |
| Toggle | Switch | Toggle semantics |

## CSS Naming Conventions

When integrating with React Aria Components, use the following CSS naming conventions:

1. Use the same classnames for our design system
2. Apply data attributes for states:
   - `data-focused`
   - `data-selected`
   - `data-disabled`
   - `data-invalid`
   - `data-state="open"`

## Best Practices

1. **Keep the same API** to maintain compatibility with existing code
2. **Use data attributes** for styling states instead of hardcoded classes
3. **Prefer composition** over inheritance
4. **Document accessibility features** gained from React Aria
5. **Maintain types** for both our API and React Aria's API
6. **Create synthetic events** for form elements to preserve onChange handlers

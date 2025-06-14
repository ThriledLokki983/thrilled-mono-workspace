import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField, Label, Input as AriaInput, FieldError, Text } from 'react-aria-components';
import type { InputProps } from './Input.interface';
import styles from './Input.module.scss';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      name,
      type = 'text',
      label,
      error,
      icon: Icon,
      className,
      required,
      disabled,
      placeholder,
      helperText,
      value,
      onChange,
      size = 'medium',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const iconSize = size === 'large' ? 20 : size === 'small' ? 16 : 18;

    // Handle change event to maintain compatibility with existing code
    const handleChange = (value: string) => {
      if (onChange) {
        const syntheticEvent = {
          target: {
            value,
            name,
            type: inputType,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <TextField
        isRequired={required}
        isDisabled={disabled}
        isInvalid={!!error}
        value={value?.toString() || ''}
        onChange={handleChange}
        className={`${styles.inputWrapper} ${className || ''}`}
        data-size={size}
        data-has-error={!!error}
        data-is-disabled={disabled}
      >
        {label && (
          <Label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </Label>
        )}
        <div className={styles.inputContainer}>
          {Icon && (
            <span className={styles.icon}>
              <Icon size={iconSize} strokeWidth={1.5} />
            </span>
          )}
          <AriaInput
            id={id}
            name={name}
            ref={ref}
            className={styles.input}
            placeholder={placeholder}
            type={inputType}
            {...props}
          />
          {type === 'password' && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={iconSize} strokeWidth={1.5} />
              ) : (
                <Eye size={iconSize} strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>
        <div className={styles.bottom}>
          {error && <FieldError className={styles.error}>{error}</FieldError>}
          {!error && helperText && (
            <Text slot="description" className={styles.helperText}>
              {helperText}
            </Text>
          )}
        </div>
      </TextField>
    );
  }
);

Input.displayName = 'Input';

Input.displayName = 'Input';
export default Input;

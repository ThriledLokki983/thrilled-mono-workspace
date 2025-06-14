import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  (
    {
      id,
      name,
      label,
      error,
      className,
      required,
      disabled,
      placeholder,
      helperText,
      value,
      onChange,
      rows = 4,
      maxLength,
      showCount = false,
      size = 'medium',
      ...props
    },
    ref
  ) => {
    const charCount = value?.toString().length || 0;

    // Handle change event to maintain compatibility with existing code
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

    return (
      <TextField
        isRequired={required}
        isDisabled={disabled}
        isInvalid={!!error}
        value={value?.toString() || ''}
        onChange={handleChange}
        className={`${styles.wrapper} ${className || ''}`}
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
        <div className={styles.textareaContainer}>
          <AriaTextArea
            ref={ref}
            id={id}
            name={name}
            className={styles.textarea}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            {...props}
          />
        </div>
        <div className={styles.bottom}>
          <AnimatePresence>
            {error && (
              <motion.div
                className={styles.error}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FieldError>{error}</FieldError>
              </motion.div>
            )}
          </AnimatePresence>
          {!error && helperText && (
            <Text slot="description" className={styles.helperText}>
              {helperText}
            </Text>
          )}
          {showCount && maxLength && (
            <p className={styles.charCount}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </TextField>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;

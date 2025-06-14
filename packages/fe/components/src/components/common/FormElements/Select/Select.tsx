import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Key } from 'react-aria-components';
import {
  Select as AriaSelect,
  SelectValue,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  Label,
  FieldError,
  Text,
} from 'react-aria-components';
import type { SelectProps } from './Select.interface';
import styles from './Select.module.scss';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      error,
      icon: Icon,
      className,
      required,
      disabled,
      placeholder,
      helperText,
      options = [],
      value,
      onChange,
      size = 'medium',
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ref
  ) => {
    // For backwards compatibility with native select
    const handleSelectionChange = (key: Key | null) => {
      if (onChange && key !== null) {
        const syntheticEvent = {
          target: {
            value: key.toString(),
            name,
          },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    // Define an interface for our item structure
    interface Item {
      id: string;
      textValue: string;
    }

    // Convert options to the format expected by React Aria
    const items = options.map((option) => ({
      id: option.value.toString(),
      textValue: option.label,
    }));

    return (
      <AriaSelect
        name={name}
        isDisabled={disabled}
        selectedKey={value?.toString()}
        onSelectionChange={handleSelectionChange}
        className={({ isOpen }) =>
          `${styles.wrapper} ${className || ''} ${isOpen ? styles.open : ''}`
        }
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

        <div className={styles.selectContainer}>
          {Icon && (
            <span className={styles.icon}>
              <Icon size={18} strokeWidth={1.5} />
            </span>
          )}

          <Button className={styles.select} id={id}>
            <SelectValue>
              {({ selectedItem }) => {
                const item = selectedItem as Item | null;
                return item ? item.textValue : placeholder;
              }}
            </SelectValue>
            <span className={styles.chevron}>
              <ChevronDown size={18} strokeWidth={1.5} />
            </span>
          </Button>

          <Popover className={styles.popover}>
            <ListBox className={styles.listBox} items={items}>
              {(item: Item) => (
                <ListBoxItem id={item.id} textValue={item.textValue} className={styles.listBoxItem}>
                  {item.textValue}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </div>

        <div className={styles.bottom}>
          <AnimatePresence>
            {error && (
              <FieldError>
                <motion.p
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.p>
              </FieldError>
            )}
          </AnimatePresence>
          {helperText && !error && (
            <Text slot="description" className={styles.helperText}>
              {helperText}
            </Text>
          )}
        </div>
      </AriaSelect>
    );
  }
);

Select.displayName = 'Select';
export default Select;

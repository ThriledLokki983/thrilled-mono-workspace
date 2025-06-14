import { forwardRef, type ChangeEvent } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CheckboxProps } from './Checkbox.interface';
import styles from './Checkbox.module.scss';

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      label,
      error,
      className,
      checked = false,
      disabled,
      helperText,
      onChange,
      indeterminate,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    };

    return (
      <div
        className={`${styles.wrapper} ${className || ''}`}
        data-checked={checked}
        data-indeterminate={indeterminate}
        data-has-error={!!error}
        data-disabled={disabled}
      >
        <label className={styles.container}>
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            className={styles.input}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            aria-checked={indeterminate ? 'mixed' : checked}
            {...props}
          />
          <span className={styles.checkbox}>
            <AnimatePresence mode="wait">
              {(checked || indeterminate) && (
                <motion.span
                  className={styles.icon}
                  initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    transition: {
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      duration: 0.5,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.3,
                    rotate: 180,
                    transition: {
                      duration: 0.2,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  {indeterminate ? (
                    <motion.span
                      className={styles.indeterminate}
                      layoutId="checkmark"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  ) : (
                    <motion.div
                      layoutId="checkmark"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          {label && <span className={styles.label}>{label}</span>}
        </label>
        {(error || helperText) && (
          <div className={styles.bottom}>
            <AnimatePresence>
              {error && (
                <motion.p
                  className={styles.error}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1],
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  {error}
                </motion.p>
              )}
              {!error && helperText && (
                <motion.p
                  className={styles.helperText}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                    delay: 0.1,
                  }}
                >
                  {helperText}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

import React from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { ButtonProps } from '@thrilled/shared';
import styles from './Button.module.scss';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  ...ariaProps
}) => {
  const buttonClasses = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth && styles['btn--full-width'],
    loading && styles['btn--loading'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AriaButton
      className={buttonClasses}
      isDisabled={loading || ariaProps.isDisabled}
      {...ariaProps}
    >
      {loading && <span className={styles.spinner} />}
      {leftIcon && !loading && (
        <span className={styles.iconLeft}>{leftIcon}</span>
      )}
      <span className={styles.content}>{children}</span>
      {rightIcon && !loading && (
        <span className={styles.iconRight}>{rightIcon}</span>
      )}
    </AriaButton>
  );
};

Button.displayName = 'Button';

import React, { forwardRef, useState, useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell, X } from 'lucide-react';
import type { AlertBarProps, AlertVariant } from './AlertBar.interface';
import styles from './AlertBar.module.scss';

/**
 * Get the appropriate icon for each alert variant
 */
const getVariantIcon = (variant: AlertVariant) => {
  switch (variant) {
    case 'info':
      return <Info />;
    case 'success':
      return <CheckCircle />;
    case 'warning':
      return <AlertTriangle />;
    case 'error':
      return <XCircle />;
    case 'notice':
      return <Bell />;
    default:
      return <Info />;
  }
};

/**
 * AlertBar Component
 *
 * A flexible alert component for displaying various types of notifications
 * with support for dismissible functionality and accessibility features.
 */
export const AlertBar = forwardRef<HTMLDivElement, AlertBarProps>(
  (
    {
      variant,
      children,
      dismissible = false,
      onDismiss,
      className,
      visible = true,
      icon,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
      setIsVisible(visible);
    }, [visible]);

    const handleDismiss = () => {
      setIsVisible(false);
      // Call onDismiss after a short delay to allow animation to complete
      setTimeout(() => {
        onDismiss?.();
      }, 200);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space key presses for accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleDismiss();
      }
    };

    const displayIcon = icon || getVariantIcon(variant);

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={`${styles.alertBar} ${className || ''}`}
        data-variant={variant}
        data-hidden={!isVisible}
        {...rest}
      >
        <div className={styles.icon} aria-hidden="true">
          {displayIcon}
        </div>

        <div className={styles.content}>
          <div className={styles.message}>{children}</div>
        </div>

        {dismissible && (
          <button
            type="button"
            className={styles.dismissButton}
            onClick={handleDismiss}
            onKeyDown={handleKeyDown}
            aria-label="Dismiss alert"
            title="Dismiss alert"
            tabIndex={0}
          >
            <X />
          </button>
        )}
      </div>
    );
  }
);

AlertBar.displayName = 'AlertBar';

export default AlertBar;

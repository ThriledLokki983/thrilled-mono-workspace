import React from 'react';
import styles from './LoadingSpinner.module.scss';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Loading spinner component for lazy-loaded routes and async operations
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
}) => {
  return (
    <div
      className={`${styles.container} ${styles[size]}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className={styles.spinner} />
      <span className={styles.message}>{message}</span>
    </div>
  );
};

export default LoadingSpinner;

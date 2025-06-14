import type { LoaderProps } from './Loader.interface';
import styles from './Loader.module.scss';

/**
 * A sophisticated full-screen loader component with rotating and bouncing animations
 */
export const Loader = ({
  message = 'Loading...',
  'aria-label': ariaLabel = 'Loading',
}: LoaderProps) => {
  return (
    <div className={styles.loader} role="status" aria-label={ariaLabel} aria-live="polite">
      <div className={styles.content}>
        <div className={styles.spinner} aria-hidden="true">
          <span className={styles['sr-only']}>{message}</span>
        </div>
        <p className={styles.text}>{message}</p>
      </div>
    </div>
  );
};

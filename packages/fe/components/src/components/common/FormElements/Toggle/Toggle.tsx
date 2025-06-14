import styles from './Toggle.module.scss';
import type { ToggleProps } from './Toggle.interface';

export const Toggle = ({
  label,
  error,
  helperText,
  className = '',
  checked = false,
  size = 'medium',
  disabled = false,
  onChange,
  ...rest
}: ToggleProps) => {
  return (
    <label className={`${styles.toggle} ${styles[size]} ${className}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} {...rest} />
      <span className={styles.switch} />
      {label && <span className={styles.label}>{label}</span>}
      {error && <span className={styles.error}>{error}</span>}
      {!error && helperText && <span className={styles.helper}>{helperText}</span>}
    </label>
  );
};

export default Toggle;

import type { ButtonProps } from './Button.interface';
import styles from './Button.module.scss';

export const Button = ({
  variant = 'primary',
  size = 'medium',
  type = 'button',
  url,
  disabled = false,
  error = false,
  children,
  onClick,
}: ButtonProps) => {
  const props = {
    className: styles.button,
    'data-variant': variant,
    'data-size': size,
    'data-error': error ? 'true' : undefined,
    disabled,
    onClick,
  };

  if (url && !disabled) {
    return (
      <a href={url} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
};

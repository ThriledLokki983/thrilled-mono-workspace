import type { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'notice';

export interface AlertBarProps {
  /**
   * The variant/type of alert which determines the styling and icon
   */
  variant: AlertVariant;

  /**
   * The content to display inside the alert
   */
  children: ReactNode;

  /**
   * Whether the alert can be dismissed by the user
   */
  dismissible?: boolean;

  /**
   * Callback function called when the alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Whether the alert should be displayed
   */
  visible?: boolean;

  /**
   * Custom icon to override the default variant icon
   */
  icon?: ReactNode;

  /**
   * Additional ARIA attributes for accessibility
   */
  'aria-label'?: string;
  'aria-describedby'?: string;
}

import type { ComponentPropsWithoutRef } from 'react';

export interface TextAreaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'size'> {
  /**
   * Label text for the textarea
   */
  label?: string;

  /**
   * Error message to display below the textarea
   */
  error?: string;

  /**
   * Helper text to display below the textarea
   */
  helperText?: string;

  /**
   * Show character count
   */
  showCount?: boolean;

  /**
   * Size variant of the textarea
   */
  size?: 'small' | 'medium' | 'large';
}

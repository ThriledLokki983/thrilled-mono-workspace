import type { ComponentPropsWithoutRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  /**
   * Label text for the input
   */
  label?: string;

  /**
   * Error message to display below the input
   */
  error?: string;

  /**
   * Helper text to display below the input
   */
  helperText?: string;

  /**
   * Icon to display on the left side of the input
   */
  icon?: LucideIcon;

  /**
   * Size variant of the input
   */
  size?: 'small' | 'medium' | 'large';
}

import type { ComponentPropsWithoutRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'size'> {
  /**
   * Label text for the select
   */
  label?: string;

  /**
   * Error message to display below the select
   */
  error?: string;

  /**
   * Helper text to display below the select
   */
  helperText?: string;

  /**
   * Icon to display on the left side of the select
   */
  icon?: LucideIcon;

  /**
   * Placeholder text for the select
   */
  placeholder?: string;

  /**
   * Options to display in the select
   */
  options: SelectOption[];

  /**
   * Size variant of the select
   */
  size?: 'small' | 'medium' | 'large';
}

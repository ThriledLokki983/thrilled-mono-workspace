// Main export file for @mono/components

// Export all components from their respective files
// export { Button } from './components/Button';
export { Button } from './components/common';
export { AlertBar } from './components/common';
export { Loader } from './components/common';
export { default as Toast } from './components/common/Toast/Toast';
export { default as Icon } from './components/common/Icon/Icon';
export { default as SkipLinks } from './components/common/SkipLinks/SkipLinks';
export { default as LoadingSpinner } from './components/common/LoadingSpinner/LoadingSpinner';

// LAYOUT COMPONENTS
export { Header } from './components/layout/Header';
export { Sidebar } from './components/layout/Sidebar';
export { Layout } from './components/layout/MainLayout';
// export { Footer } from './components/layout/Footer';


export { Input, TextArea, Select, Checkbox, Toggle } from './components/common/FormElements';
export type { InputProps, TextAreaProps, SelectProps, SelectOption } from './components/common/FormElements';


// Export all types and interfaces
export type { ButtonProps } from '@thrilled/shared';
export type { LoadingSpinnerProps } from './components/common/LoadingSpinner/LoadingSpinner';
export type { ButtonProps as CommonButtonProps } from './components/common/Button/Button.interface';
export type { LoaderProps } from './components/common/Loader/Loader.interface';
export type { AlertBarProps, AlertVariant } from './components/common/AlertBar/AlertBar.interface';

// Export types from common interfaces
export type { CustomRouteObject, NavigationItem, UserMenuItem, SidebarProps } from './types/common-interfaces';


// Example structure (uncomment and modify as you add more components):
// export { Card } from './components/Card/Card';
// export { Modal } from './components/Modal/Modal';
// export { Input } from './components/Input/Input';
// export type { CardProps } from './components/Card/Card.types';

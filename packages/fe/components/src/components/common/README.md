# Frontend Base Component Library

## Architecture

This component library uses Adobe's React Aria Components as a foundation for accessible UI components while maintaining our custom design system.

### Design Principles

1. **Accessibility First**: All components are built on React Aria Components to ensure WCAG 2.1 AA compliance.
2. **Design System Consistency**: Components follow our established design system with a 4pt spacing grid, specific color palette, and typography rules.
3. **Abstraction Layer**: We abstract React Aria Components behind our own API for better developer experience and consistency.

### Integration Pattern

```tsx
// Example pattern for integrating React Aria with our design system
import { SomeComponent as AriaSomeComponent } from 'react-aria-components';
import styles from './SomeComponent.module.scss';

export const SomeComponent = forwardRef<HTMLElement, OurComponentProps>((props, ref) => {
  // Map our props to React Aria props
  return (
    <AriaSomeComponent 
      // React Aria props
      className={styles.ourComponentClass}
    >
      {/* Render with our design system */}
    </AriaSomeComponent>
  );
});
```

### Benefits

- **Accessibility**: Comprehensive keyboard, screen reader, and touch support
- **Behavior Consistency**: Uniform behavior across browsers and platforms
- **Design Freedom**: Fully customizable styling while maintaining accessibility
- **Developer Experience**: Simple, familiar API for all components

## Adding New Components

When adding new components:

1. Create the component with React Aria Components as the foundation
2. Style it according to our design system
3. Maintain the familiar API pattern
4. Document the component's props and usage

## Styling

All components use CSS Modules with our design tokens. Common design tokens are defined in `src/styles/design-tokens.scss`.

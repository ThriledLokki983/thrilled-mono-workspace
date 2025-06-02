# @mono/components

A shared React components library for the Thrilled mono-workspace. This library provides reusable UI components that can be consumed by any React frontend application in the workspace.

## 🎯 Overview

This library is built with:

- **React 19** - Modern React with latest features
- **React Aria Components** - Accessible, unstyled UI primitives
- **TypeScript** - Full type safety
- **Vite** - Fast bundling and development
- **SCSS** - Styling with Sass support
- **Vitest** - Testing framework
- **ESLint** - Code quality and consistency

## 📦 Installation & Usage

### For Workspace Projects

Since this is part of an Nx workspace, you can import components directly:

```typescript
import { Button, Card, Modal } from '@mono/components';

function App() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <Card title="Example Card">
        <p>Card content goes here</p>
      </Card>
    </div>
  );
}
```

### For External Projects

If publishing to npm, install as a dependency:

```bash
npm install @mono/components
# or
yarn add @mono/components
```

## 🏗️ Development

### Building the Library

```bash
# Build the library
nx build components

# Build with watch mode (for development)
nx build components --watch
```

### Running Tests

```bash
# Run tests
nx test components

# Run tests in watch mode
nx test components --watch

# Run tests with coverage
nx test components --coverage
```

### Linting

```bash
# Lint the library
nx lint components

# Lint and fix issues
nx lint components --fix
```

### Type Checking

```bash
# Run TypeScript type checking
nx typecheck components
```

## 📁 Project Structure

```
packages/shared/components/
├── src/
│   ├── index.ts              # Main export file
│   ├── components/           # Individual components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.module.scss
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── types/               # Shared TypeScript types
├── dist/                    # Built output
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🧱 Component Guidelines

### Creating a New Component

1. **Create component folder**: `src/components/ComponentName/`
2. **Component file**: `ComponentName.tsx`
3. **Types file**: `ComponentName.types.ts`
4. **Styles file**: `ComponentName.module.scss`
5. **Test file**: `ComponentName.test.tsx`
6. **Index file**: `index.ts` (for clean exports)

### Component Template

```typescript
// Button.types.ts
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

// Button.tsx
import React from 'react';
import { ButtonProps } from './Button.types';
import styles from './Button.module.scss';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### React Aria Components

This library uses [React Aria Components](https://react-spectrum.adobe.com/react-aria/) as the foundation for all interactive components. React Aria provides accessible, unstyled UI primitives that we customize with our own styling.

#### Benefits of React Aria Components

- **Accessibility**: Built-in ARIA support, keyboard navigation, and screen reader compatibility
- **Behavior**: Handles complex interaction patterns (focus management, keyboard shortcuts)
- **Unstyled**: Complete control over styling while maintaining functionality
- **Cross-platform**: Works consistently across different browsers and devices

#### Component Pattern

```typescript
// Using React Aria Button as the base
import { Button as AriaButton } from 'react-aria-components';
import { ButtonProps } from './Button.types';
import styles from './Button.module.scss';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  ...ariaProps
}) => {
  return (
    <AriaButton
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      {...ariaProps}
    >
      {children}
    </AriaButton>
  );
};
```

#### Available React Aria Components

Common components to build with:

- `Button`, `ToggleButton`
- `TextField`, `SearchField`, `NumberField`
- `Select`, `ComboBox`, `ListBox`
- `Dialog`, `Modal`, `Popover`
- `Menu`, `MenuTrigger`
- `Tabs`, `TabList`, `Tab`, `TabPanel`
- `Checkbox`, `Radio`, `RadioGroup`
- `Slider`, `RangeSlider`
- `ProgressBar`, `Meter`

Refer to the [React Aria Components documentation](https://react-spectrum.adobe.com/react-aria/components.html) for complete API reference.

### Exporting Components

Add your component to the main `src/index.ts` file:

```typescript
// Export the component
export { Button } from './components/Button';
export { Card } from './components/Card';

// Export types
export type { ButtonProps } from './components/Button';
export type { CardProps } from './components/Card';
```

## 🎨 Styling Guidelines

- Use **SCSS modules** for component styling
- Import styles from the `@mono/styles` package for consistency
- Follow BEM methodology for CSS class naming
- Use CSS custom properties for theming

```scss
// Button.module.scss
@import '@mono/styles';

.button {
  @include button-base;

  &.primary {
    background-color: var(--color-primary);
    color: var(--color-white);
  }

  &.large {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}
```

## 🧪 Testing Guidelines

- Write tests for all components using **Vitest** and **React Testing Library**
- Test component behavior, not implementation details
- Include accessibility tests where relevant

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🔄 Module Boundaries

This library follows Nx module boundary rules:

- **Tag**: `type:lib`, `scope:shared`, `npm:public`
- **Can depend on**: Libraries with tags `type:lib`, `type:util`, `scope:shared`
- **Cannot depend on**: Application-specific libraries

## 📝 Peer Dependencies

This library requires the following peer dependencies:

```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0"
}
```

## 🚀 Publishing

The library is configured for publishing to npm with proper TypeScript declarations and ES modules.

```bash
# Build for production
nx build components

# Publish (configured in nx.json)
nx nx-release-publish components
```

## 🤝 Contributing

1. Follow the component guidelines above
2. Ensure all tests pass: `nx test components`
3. Ensure linting passes: `nx lint components`
4. Update this README if adding new patterns or guidelines

## 📚 Related Packages

- `@mono/styles` - Shared styles and design tokens
- `@mono/types` - Shared TypeScript types
- `@mono/custom-eslint` - ESLint configurations

---

**Ready to add your components!** 🎉

# @thrilled/shared

A comprehensive TypeScript types library for the Thrilled monorepo workspace. This package provides shared type definitions for frontend components, backend APIs, and application-level interfaces, ensuring type safety and consistency across all packages.

## Features

- 🎯 **Frontend Types** - React component props, UI interfaces, and API client types
- 🔧 **Backend Types** - Server interfaces and data structures
- 📱 **App Types** - Application-level configurations and shared interfaces
- ⚡ **React Integration** - Full React and React Aria Components compatibility
- 🏗️ **Modular Architecture** - Organized by domain for selective imports
- 📦 **ES Modules** - Modern JavaScript module format
- 🔄 **Nx Compatible** - Seamlessly integrates with Nx monorepo workflows

## Installation

This package is part of the monorepo and is automatically available to other workspace packages:

```typescript
import { ButtonProps, HeaderProps } from '@thrilled/shared';
import type { ApiResponse, Environment } from '@thrilled/shared';
```

For external projects:

```bash
npm install @thrilled/shared
```

## Usage

### Complete Import

Import all types from the main entry point:

```typescript
import { 
  // UI Component Types
  ButtonProps, 
  LinkProps, 
  HeaderProps,
  
  // Base Types
  BaseComponentProps,
  Environment,
  
  // API Types
  ApiResponse,
  ApiEndpoints
} from '@thrilled/shared';
```

### Selective Module Imports

Import specific modules as needed:

```typescript
// Frontend types only
import type { ButtonProps, LinkProps } from '@thrilled/shared/fe';

// UI component types only
import type { HeaderProps } from '@thrilled/shared/fe/ui';

// API types only
import type { ApiResponse } from '@thrilled/shared/fe/api';

// App configuration types
import type { AppConfig } from '@thrilled/shared/app';

// Backend types
import type { ServerConfig } from '@thrilled/shared/be';
```

## Type Categories

### 🎭 Frontend Types (`/fe`)

#### UI Components (`/fe/ui`)

**Base Component Types**
```typescript
import type { BaseComponentProps } from '@thrilled/shared';

interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  testId?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isDisabled?: boolean;
  isLoading?: boolean;
}
```

**Button Types**
```typescript
import type { ButtonProps } from '@thrilled/shared';

// Extends React Aria ButtonProps with custom variants
interface ButtonProps extends AriaButtonProps, BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isFullWidth?: boolean;
}
```

**Link Types**
```typescript
import type { LinkProps } from '@thrilled/shared';

// Extends React Aria LinkProps with custom styling
interface LinkProps extends AriaLinkProps, BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'muted';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isExternal?: boolean;
  showExternalIcon?: boolean;
}
```

**Header Types**
```typescript
import type { HeaderProps, NavigationItem } from '@thrilled/shared';

interface HeaderProps extends BaseComponentProps {
  logo?: string | React.ReactNode;
  navigationItems?: NavigationItem[];
  showSearch?: boolean;
  showProfile?: boolean;
  isSticky?: boolean;
}

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType | string;
  isActive?: boolean;
  children?: NavigationItem[];
}
```

#### Base Types (`/fe/base`)

**Core Interface Types**
```typescript
import type { Environment, ThemeMode } from '@thrilled/shared';

type Environment = 'development' | 'staging' | 'production';
type ThemeMode = 'light' | 'dark' | 'system';
```

#### API Types (`/fe/api`)

**API Response Types**
```typescript
import type { ApiResponse, ApiEndpoints } from '@thrilled/shared';

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    refresh: string;
  };
  users: {
    profile: string;
    update: string;
  };
  // ... more endpoints
}
```

### 🔧 Backend Types (`/be`)

Server-side interfaces and data structures (to be expanded based on backend needs).

### 📱 App Types (`/app`)

**Application Configuration**
```typescript
import type { AppConfig } from '@thrilled/shared';

interface AppConfig {
  environment: Environment;
  theme: ThemeMode;
  features: {
    darkMode: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}
```

## Architecture

```
src/
├── index.ts              # Main entry point - exports all types
├── lib/                  # Core library types
│   ├── shared.ts        # Shared utility types
│   └── shared.spec.ts   # Type tests
├── fe/                   # Frontend-specific types
│   ├── index.ts         # Frontend exports
│   ├── base/            # Base/foundation types
│   │   ├── base.ts      # Environment, ThemeMode, etc.
│   │   └── index.ts     # Base exports
│   ├── ui/              # UI component types
│   │   ├── index.ts     # UI exports
│   │   ├── base.ts      # Base component props
│   │   ├── button.ts    # Button component types
│   │   ├── link.ts      # Link component types
│   │   └── header.ts    # Header component types
│   └── api/             # API-related types
│       ├── index.ts     # API exports
│       ├── api-response.ts    # Response interfaces
│       └── api-endpoints.ts   # Endpoint definitions
├── be/                   # Backend-specific types
│   └── index.ts         # Backend exports (to be expanded)
└── app/                  # Application-level types
    ├── index.ts         # App exports
    └── app.ts           # App configuration types
```

## Dependencies

### Peer Dependencies
- **React** `^19.0.0` - For React component types
- **React Aria Components** `^1.5.1` - For accessible component types

### Dev Dependencies
- **@types/react** `^19.0.5` - React TypeScript definitions

## Building

Build the library for distribution:

```bash
nx build shared
```

This will:
1. Compile TypeScript to ES modules
2. Generate declaration files (.d.ts)
3. Create optimized bundle in `dist/`

## Testing

Run type checking and unit tests:

```bash
nx test shared
```

## Linting

Ensure code quality and consistency:

```bash
nx lint shared
```

## Integration Examples

### React Component Usage

```typescript
import React from 'react';
import type { ButtonProps, HeaderProps } from '@thrilled/shared';

const MyButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
};

const MyHeader: React.FC<HeaderProps> = ({
  logo,
  navigationItems,
  ...props
}) => {
  return (
    <header {...props}>
      {logo && <div className="logo">{logo}</div>}
      {/* Navigation implementation */}
    </header>
  );
};
```

### API Client Usage

```typescript
import type { ApiResponse, ApiEndpoints } from '@thrilled/shared';

class ApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint);
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

### Configuration Usage

```typescript
import type { AppConfig, Environment } from '@thrilled/shared';

const createAppConfig = (env: Environment): AppConfig => ({
  environment: env,
  theme: 'system',
  features: {
    darkMode: true,
    notifications: env === 'production',
    analytics: env === 'production',
  },
});
```

## Contributing

1. Add new types to the appropriate module (`fe/`, `be/`, or `app/`)
2. Export new types from the module's `index.ts`
3. Update this README with usage examples
4. Run tests to ensure type safety: `nx test shared`
5. Build to verify compilation: `nx build shared`

## Version History

- **0.0.1** - Initial setup with frontend UI component types, base types, and API interfaces

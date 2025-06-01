# @mono/custom-eslint

Shared ESLint configurations for React projects and Prettier formatting in the Thrilled monorepo.

## Configurations

This package provides two main configurations:

### React Configuration (`@mono/custom-eslint/react`)

- Complete ESLint setup for React + TypeScript projects
- Includes React, React Hooks, and React Refresh rules
- TypeScript-specific linting rules
- Optimized for modern React development (React 17+)

### Prettier Configuration (`@mono/custom-eslint/prettier`)

- Comprehensive Prettier formatting rules
- File-type specific overrides for TypeScript, JSON, Markdown, etc.
- Consistent code formatting across the workspace

## Philosophy

This package follows a **local-first ESLint approach**:

- Each package/app manages its own base ESLint configuration
- Shared configurations focus on React-specific and Prettier rules
- Nx module boundary enforcement is handled at the workspace level
- Avoids complex module resolution issues in monorepo environments

## Installation

The package is automatically available in the workspace. For individual packages:

```bash
yarn add -D @mono/custom-eslint
```

## Usage

### For React Projects

Create an `.eslintrc.json` in your React project:

```json
{
  "extends": ["@mono/custom-eslint/react"],
  "ignorePatterns": ["!**/*", "dist", "node_modules"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        // Add any project-specific rules here
      }
    }
  ]
}
```

### For Prettier Configuration

Add to your `package.json` or create a `prettier.config.js`:

```javascript
module.exports = require('@mono/custom-eslint/prettier');
```

### For Non-React Projects

Create a local ESLint configuration with your preferred base rules, then optionally use the Prettier config:

```json
{
  "plugins": ["@nx"],
  "extends": ["eslint:recommended"],
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          // Add your project constraints
        ]
      }
    ]
  }
}
```

## Peer Dependencies

Make sure your project has these dependencies installed:

- `eslint` >= 8.0.0
- `prettier` >= 2.0.0

For React projects, also install:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `eslint-config-prettier`

## Features

### React Configuration Includes:

- **TypeScript Support**: Full TypeScript linting with sensible defaults
- **React 17+ Optimized**: No need for `React` imports in JSX files
- **Hooks Linting**: Comprehensive React Hooks rules
- **Dev Experience**: React Refresh support for fast development
- **Type Safety**: TypeScript-aware React component linting

### Prettier Configuration Includes:

- **Consistent Formatting**: Unified code style across all file types
- **File-Specific Rules**: Tailored formatting for TS, JS, JSON, Markdown, etc.
- **Readable Output**: Optimized for code readability and team collaboration

## Examples

Check the `packages/` directory for examples of how different project types use these configurations.

## Contributing

When adding new rules:

1. Test across multiple project types in the workspace
2. Consider the impact on developer experience
3. Document any breaking changes
4. Update this README with new features

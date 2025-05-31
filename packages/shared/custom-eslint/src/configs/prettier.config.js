/**
 * Prettier configuration for consistent code formatting
 * @mono/custom-eslint/prettier
 */

module.exports = {
  // Print width - max line length
  printWidth: 80,
  
  // Tab width for indentation
  tabWidth: 2,
  
  // Use spaces instead of tabs
  useTabs: false,
  
  // Add semicolons at end of statements
  semi: true,
  
  // Use single quotes instead of double quotes
  singleQuote: true,
  
  // Quote object keys only when necessary
  quoteProps: 'as-needed',
  
  // Use single quotes in JSX
  jsxSingleQuote: true,
  
  // Trailing commas for cleaner diffs
  trailingComma: 'es5',
  
  // Spaces inside object literals
  bracketSpacing: true,
  
  // Put > on same line for JSX
  bracketSameLine: false,
  
  // Arrow function parentheses
  arrowParens: 'avoid',
  
  // Range formatting (entire file)
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // No need for pragma
  requirePragma: false,
  insertPragma: false,
  
  // Prose wrapping
  proseWrap: 'preserve',
  
  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',
  
  // Vue files script and style tag indentation
  vueIndentScriptAndStyle: false,
  
  // Line endings (auto detect based on file content)
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Single attribute per line in HTML/JSX
  singleAttributePerLine: false,
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        printWidth: 100,
        singleQuote: false,
      },
    },
  ],
};

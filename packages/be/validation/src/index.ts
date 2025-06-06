// Main exports for the validation package

// Schema validation
export { JoiValidator } from './validators/JoiValidator.js';
export { ZodValidator } from './validators/ZodValidator.js';
export { ValidationMiddleware } from './middleware/ValidationMiddleware.js';

// Sanitization
export { Sanitizer } from './sanitization/Sanitizer.js';
export { XSSProtection } from './sanitization/XSSProtection.js';
export { SQLInjectionProtection } from './sanitization/SQLInjectionProtection.js';

// Custom validators
export { CustomValidators } from './validators/CustomValidators.js';
export { ValidationUtils } from './utils/ValidationUtils.js';

// Types
export type {
  ValidationResult,
  ValidationError,
  ValidationOptions,
  SanitizationOptions,
  ValidatorFunction,
  SchemaValidationConfig,
} from './types/index.js';

// Plugin
export { ValidationPlugin } from './plugin/ValidationPlugin.js';

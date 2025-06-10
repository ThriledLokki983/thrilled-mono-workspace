import { envValidators } from '@thrilled/be-types';

export const ValidateEnv = () => {
  // Validate all environment variables required by the application
  return envValidators.validateFullAppEnv();
};

/**
 * @mono/custom-eslint - Shared ESLint configurations
 */

const reactConfig = require('./configs/react.js');
const prettierConfig = require('./configs/prettier.config.js');

module.exports = {
  react: reactConfig,
  prettier: prettierConfig,
};

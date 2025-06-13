const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

/**
 * This script combines the main swagger.yaml file with additional swagger component files
 * to create a comprehensive API documentation.
 */

// Define file paths
const mainSwaggerPath = path.join(__dirname, '../../swagger.yaml');
const journeySwaggerPath = path.join(__dirname, '../../swagger-journey.yaml');
const onboardingSwaggerPath = path.join(__dirname, '../../swagger-onboarding.yaml');
const financialSwaggerPath = path.join(__dirname, '../../swagger-financial.yaml');
const outputPath = path.join(__dirname, '../../swagger-combined.yaml');

// Read the files
const mainSwagger = yaml.load(fs.readFileSync(mainSwaggerPath, 'utf8'));
const journeySwagger = yaml.load(fs.readFileSync(journeySwaggerPath, 'utf8'));

// Check if onboarding swagger file exists
let onboardingSwagger = null;
if (fs.existsSync(onboardingSwaggerPath)) {
  onboardingSwagger = yaml.load(fs.readFileSync(onboardingSwaggerPath, 'utf8'));
}

// Check if financial swagger file exists
let financialSwagger = null;
if (fs.existsSync(financialSwaggerPath)) {
  financialSwagger = yaml.load(fs.readFileSync(financialSwaggerPath, 'utf8'));
}

// Combine the paths
Object.assign(mainSwagger.paths, journeySwagger.paths);
if (onboardingSwagger && onboardingSwagger.paths) {
  Object.assign(mainSwagger.paths, onboardingSwagger.paths);
}
if (financialSwagger && financialSwagger.paths) {
  Object.assign(mainSwagger.paths, financialSwagger.paths);
}

// Combine the components schemas
if (!mainSwagger.components) {
  mainSwagger.components = {};
}

if (!mainSwagger.components.schemas) {
  mainSwagger.components.schemas = {};
}

// Add journey schemas
if (journeySwagger.components && journeySwagger.components.schemas) {
  Object.assign(mainSwagger.components.schemas, journeySwagger.components.schemas);
}

// Add onboarding schemas if they exist
if (onboardingSwagger && onboardingSwagger.components && onboardingSwagger.components.schemas) {
  Object.assign(mainSwagger.components.schemas, onboardingSwagger.components.schemas);
}

// Add financial schemas if they exist
if (financialSwagger && financialSwagger.components && financialSwagger.components.schemas) {
  Object.assign(mainSwagger.components.schemas, financialSwagger.components.schemas);
}

// Write the combined swagger file
fs.writeFileSync(outputPath, yaml.dump(mainSwagger));

console.log('Combined Swagger documentation created at:', outputPath);

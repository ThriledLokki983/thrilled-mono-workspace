// Quick test script for the new logger
const { logger, redactSensitiveData, logUserData } = require('./dist/utils/logger');

console.log('Testing logger integration...');

// Test basic logging
logger.info('Logger integration test started');
logger.debug('This is a debug message');
logger.warn('This is a warning message');
logger.error('This is an error message');

// Test sensitive data redaction
const testData = {
  username: 'john_doe',
  password: 'secret123',
  email: 'john@example.com',
  token: 'abc123xyz',
  normalField: 'this should not be redacted'
};

console.log('Original data:', testData);
console.log('Redacted data:', redactSensitiveData(testData));

// Test logUserData function
logUserData('info', 'User logged in', testData);

console.log('Logger test completed!');

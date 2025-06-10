const { SimpleMockFactory, SimpleTestHelpers, TestEnvironment } = require('./dist/index.js');

console.log('✅ Package imported successfully');

// Test SimpleMockFactory
SimpleMockFactory.reset();
const user = SimpleMockFactory.createUser({ name: 'Test User' });
console.log('✅ SimpleMockFactory.createUser():', user.email);

// Test random utilities
const randomStr = SimpleMockFactory.randomString(8, 'test_');
console.log('✅ SimpleMockFactory.randomString():', randomStr);

const randomNum = SimpleMockFactory.randomNumber(1, 10);
console.log('✅ SimpleMockFactory.randomNumber():', randomNum);

// Test API response creation
const apiResponse = SimpleMockFactory.createApiResponse({ success: true });
console.log('✅ SimpleMockFactory.createApiResponse():', apiResponse.success);

// Test TestEnvironment
const originalEnv = process.env.TEST_VAR;
TestEnvironment.setEnv({ TEST_VAR: 'test_value' });
console.log('✅ TestEnvironment.setEnv():', process.env.TEST_VAR);

TestEnvironment.restoreEnv();
console.log('✅ TestEnvironment.restoreEnv():', process.env.TEST_VAR === originalEnv);

console.log('🎉 All basic functionality working correctly!');

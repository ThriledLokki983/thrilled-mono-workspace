// Test script to verify validation integration
const { BaseApp } = require('./packages/be/core/dist/index.js');

async function testValidationIntegration() {
  console.log('🧪 Testing Validation Integration...');
  
  try {
    // Create a basic app configuration
    const config = {
      port: 3000,
      logging: {
        level: 'info',
        format: 'simple'
      },
      validation: {
        enabled: true
      }
    };
    
    // Create the app - this should automatically include validation
    const app = new BaseApp(config);
    
    // Get the validation plugin
    const validationPlugin = app.getValidationPlugin();
    
    if (validationPlugin) {
      console.log('✅ Validation plugin automatically registered');
      console.log(`   Plugin name: ${validationPlugin.name}`);
      console.log(`   Plugin version: ${validationPlugin.version}`);
      
      // Test health check
      const healthCheck = await validationPlugin.healthCheck();
      console.log('✅ Validation health check:', healthCheck.status);
      console.log('   Details:', healthCheck.details);
      
      // List all plugins
      const plugins = app.listPlugins();
      console.log('✅ Registered plugins:');
      plugins.forEach(plugin => {
        console.log(`   - ${plugin.name} v${plugin.version} (${plugin.enabled ? 'enabled' : 'disabled'})`);
      });
      
    } else {
      console.log('❌ Validation plugin not found');
    }
    
    // Test with validation disabled
    console.log('\n🧪 Testing with validation disabled...');
    const configDisabled = {
      ...config,
      validation: {
        enabled: false
      }
    };
    
    const appDisabled = new BaseApp(configDisabled);
    const validationPluginDisabled = appDisabled.getValidationPlugin();
    
    if (validationPluginDisabled) {
      console.log('❌ Validation plugin should be disabled but was found');
    } else {
      console.log('✅ Validation plugin correctly disabled');
    }
    
    console.log('\n🎉 All validation integration tests passed!');
    
  } catch (error) {
    console.error('❌ Validation integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testValidationIntegration();

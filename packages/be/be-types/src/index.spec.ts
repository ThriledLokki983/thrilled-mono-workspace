import * as types from './index.js';

describe('be-types', () => {
  it('should export all type modules', () => {
    // Test that the main exports are available
    expect(types).toBeDefined();
    expect(typeof types).toBe('object');
  });

  it('should have config types', () => {
    // This will ensure that the config module exports are accessible
    expect(() => {
      // We don't need to actually test the types, just that they can be imported
      const configModule = require('./config');
      expect(configModule).toBeDefined();
    }).not.toThrow();
  });

  it('should have auth types', () => {
    expect(() => {
      const authModule = require('./auth');
      expect(authModule).toBeDefined();
    }).not.toThrow();
  });

  it('should have database types', () => {
    expect(() => {
      const databaseModule = require('./database');
      expect(databaseModule).toBeDefined();
    }).not.toThrow();
  });

  it('should have api types', () => {
    expect(() => {
      const apiModule = require('./api');
      expect(apiModule).toBeDefined();
    }).not.toThrow();
  });

  it('should have plugin types', () => {
    expect(() => {
      const pluginModule = require('./plugin');
      expect(pluginModule).toBeDefined();
    }).not.toThrow();
  });
});

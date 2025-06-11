import { CLI_VERSION } from './cli';

describe('cli', () => {
  it('should export CLI_VERSION', () => {
    expect(CLI_VERSION).toEqual('1.0.0');
  });
});

import { register } from 'module';
import { pathToFileURL } from 'url';
import { register as registerTsNode } from 'ts-node/esm';

// Register ts-node/esm
await registerTsNode({
  'ts-node': {
    project: 'tsconfig.dev.json'
  }
});

// Register tsconfig-paths for path mapping support
register('tsconfig-paths/esm', pathToFileURL('./'));

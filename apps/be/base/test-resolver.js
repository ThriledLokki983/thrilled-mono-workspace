const path = require('path');
const fs = require('fs');

module.exports = {
  sync: (request, options) => {
    // Only handle relative imports that end with .js from our packages
    if (request.startsWith('./') || request.startsWith('../')) {
      const { basedir } = options;

      // Check if we're in one of our packages
      if (basedir.includes('/packages/be/')) {
        const requestWithoutExt = request.replace(/\.js$/, '');
        const tsFile = path.resolve(basedir, requestWithoutExt + '.ts');

        if (fs.existsSync(tsFile)) {
          return tsFile;
        }
      }
    }

    // Default behavior for everything else
    return options.defaultResolver(request, options);
  }
};

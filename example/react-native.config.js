const path = require('node:path');
const pkg = require('../package.json');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      // Codegen requires an explicit platform map for a linked local package.
      platforms: { ios: {}, android: null },
    },
  },
};

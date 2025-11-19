const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'mocha/no-exclusive-tests': 'error',
    },
  },
];

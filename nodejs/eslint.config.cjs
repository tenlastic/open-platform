const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const jsdocPlugin = require('eslint-plugin-jsdoc');
const mochaPlugin = require('eslint-plugin-mocha');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  { ignores: ['**/*.cjs', '**/*.js'] },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      globals: { ...globals.mocha, ...globals.node, NodeJS: 'readonly' },
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      jsdoc: jsdocPlugin,
      mocha: mochaPlugin.default,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-namespace': 'off',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 0 }],
      'max-len': ['error', { code: 100 }],
      'no-empty': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'mocha/no-exclusive-tests': 'error',
    },
  },
  prettierConfig,
];

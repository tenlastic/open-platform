/* eslint-disable */
module.exports = {
  extends: '../../.eslintrc.js',
  ignorePatterns: ['!**/*', 'node_modules/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        createDefaultProgram: true,
        project: ['tsconfig.lib.json', 'tsconfig.spec.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'ten',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'ten',
            style: 'kebab-case',
          },
        ],
      },
    },
    {
      files: ['*.html'],
      rules: {},
    },
  ],
};

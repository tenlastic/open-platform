/* eslint-disable */
module.exports = {
  root: true,
  ignorePatterns: ['applications/**/*', 'modules/**/*'],
  rules: {
    curly: 'error',
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        createDefaultProgram: true,
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      extends: [
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      rules: {
        '@angular-eslint/component-selector': [
          'error',
          {
            prefix: 'app',
            style: 'kebab-case',
            type: 'element',
          },
        ],
        '@angular-eslint/directive-selector': [
          'error',
          {
            prefix: 'app',
            style: 'camelCase',
            type: 'attribute',
          },
        ],
      },
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {},
    },
  ],
};

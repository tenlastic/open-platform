#!/bin/bash
set -e

eslint \
  -c "../../.eslintrc.js" \
  --ext ".ts" \
  --no-error-on-unmatched-pattern \
  --parser-options "{ project: ['tsconfig.app.json', 'tsconfig.spec.json'], tsconfigRootDir: './' }" \
  'src/**/*.ts'

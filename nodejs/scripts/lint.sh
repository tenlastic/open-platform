#!/bin/bash
set -e

eslint \
  -c "../../.eslintrc.js" \
  --ext ".ts" \
  --no-error-on-unmatched-pattern \
  --parser-options "{ tsconfigRootDir: './' }" \
  'src/**/*.ts'

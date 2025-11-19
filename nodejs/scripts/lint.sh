#!/bin/bash
set -e

eslint \
  --ext ".ts" \
  --no-error-on-unmatched-pattern \
  'src/**/*.ts'

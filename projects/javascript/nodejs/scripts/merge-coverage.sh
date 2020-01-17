#!/bin/bash
set -e

# Remove the previous test results.
rm -rf ./test-results/coverage/

# Merge code coverage reports.
istanbul-combine \
  -d "./test-results/coverage" \
  -r "html" \
  -r "json" \
  ./applications/*/test-results/coverage/coverage-final.json \
  ./modules/*/test-results/coverage/coverage-final.json


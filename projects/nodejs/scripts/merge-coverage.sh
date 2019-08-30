#!/bin/bash
set -e

# Remove the previous test results.
rm -rf ./test-results/coverage/

# Merge regular tests.
istanbul-merge \
  --out "./test-results/coverage/cobertura.json" \
  $(find . -type f -name "coverage-final.json")

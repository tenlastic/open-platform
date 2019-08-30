#!/bin/bash
set -e

# Remove the previous test results.
rm -rf ./test-results/

# Merge regular tests.
junit-merge \
  --createDir \
  --out "./test-results/test-results.xml" \
  $(find . -type f -name "test-results.xml")

# Merge end-to-end tests.
junit-merge \
  --createDir \
  --out "./test-results/test-results.e2e.xml" \
  $(find . -type f -name "test-results.e2e.xml")

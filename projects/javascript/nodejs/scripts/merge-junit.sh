#!/bin/bash
set -e

# Merge regular tests.
rm -f "./test-results/test-results.xml"
junit-merge \
  --createDir \
  --out "./test-results/test-results.xml" \
  $(find . -type f -name "test-results.xml")

# Merge end-to-end tests.
rm -f "./test-results/test-results.e2e.xml"
junit-merge \
  --createDir \
  --out "./test-results/test-results.e2e.xml" \
  $(find . -type f -name "test-results.e2e.xml")

#!/bin/bash
set -e

# Lint, test, and build Angular applications.
lerna run lint --ci --since
lerna run build --ci --concurrency 1 --include-dependencies --since
lerna run test --ci --concurrency 1 --since

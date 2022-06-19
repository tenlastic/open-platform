#!/bin/bash
set -e

# Lint, test, and build Angular applications.
lerna run lint --since
lerna run build --concurrency 1 --include-dependencies --since
lerna run test --concurrency 1 --since

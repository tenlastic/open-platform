#!/bin/bash
set -e

# Lint, build, and test NodeJS applications.
lerna run lint --ci --since 
lerna run build --ci --include-dependencies --since
lerna run test --ci --since

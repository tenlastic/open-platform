#!/bin/bash
set -e

# Lint, build, and test NodeJS applications.
lerna run lint --since 
lerna run build --include-dependencies --since
lerna run test --since

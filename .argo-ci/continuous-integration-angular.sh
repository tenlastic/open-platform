#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Lint, test, and build Angular applications.
lerna run lint --ci --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run test --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run build --ci --concurrency 1 --include-dependencies --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since

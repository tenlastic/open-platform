#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Lint, build, and test NodeJS applications.
lerna run lint --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since 
lerna run build --ci --include-dependencies --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since
lerna run test --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since

#!/bin/bash
set -e

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --include-dependencies --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since
lerna run --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* lint
lerna run --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* build
lerna run --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* test

# Remove Node Modules.
find . -name "node_modules" -exec rm -rf '{}' +

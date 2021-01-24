#!/bin/bash
set -e

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --hoist --include-dependencies --strict --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --scope nodejs --since
lerna run lint --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since 
lerna run build --ci --include-dependencies --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since
lerna run test --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since

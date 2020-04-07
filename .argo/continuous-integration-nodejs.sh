#!/bin/bash
set -e

ROOT=$(pwd)

# Reset Git Changes from Argo Artifacts.
git reset --hard

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --include-dependencies --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --since
lerna run --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --scope nodejs lint
lerna run --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --scope nodejs build
lerna run --ci --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* --scope nodejs test

# Remove Node Modules.
find . -name "node_modules" -exec rm -rf '{}' +

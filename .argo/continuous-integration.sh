#!/bin/bash
set -e

# Allow Scripts to Execute (Argo Artifact Bug).
chmod +x -R ./

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --concurrency 1 --include-dependencies --since
lerna run lint --ci --concurrency 1 --include-dependencies --since
lerna run build --ci --concurrency 1 --include-dependencies --since
lerna run test --ci --concurrency 1 --include-dependencies --since

# Merge NodeJS Test Results.
cd "${ROOT}/projects/javascript/nodejs/"
npm ci
npm run merge:junit
npm run merge:coverage
npm ci --prefix ./modules/mochawesome-merge-json/
npm run merge:mochawesome

# Remove Node Modules.
find . -name "node_modules" -exec rm -rf '{}' +
#!/bin/bash
set -e

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/nodejs/applications/migrations/"
npm i -g lerna
lerna bootstrap --ci --hoist --include-dependencies --strict
lerna run build --ci --concurrency 1 --include-dependencies --scope @tenlastic/migrations --scope nodejs
npm run start

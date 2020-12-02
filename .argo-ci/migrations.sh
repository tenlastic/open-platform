#!/bin/bash
set -e

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/nodejs/applications/migrations/"
npm i -g lerna
lerna bootstrap --ci --include-dependencies --scope @tenlastic/migrations --scope nodejs
npm run start

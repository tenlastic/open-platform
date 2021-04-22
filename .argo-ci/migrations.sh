#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/nodejs/applications/migrations/"

# Build and run MongoDB migrations.
lerna run build --ci --include-dependencies --scope @tenlastic/migrations --scope nodejs
npm run start

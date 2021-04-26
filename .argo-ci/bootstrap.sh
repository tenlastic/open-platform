#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install NPM dependencies.
npm set cache npm-cache
lerna bootstrap --ci --hoist --strict

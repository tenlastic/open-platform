#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install NPM dependencies.
lerna bootstrap --ci --concurrency 1 --registry "https://verdaccio.tenlastic.com"

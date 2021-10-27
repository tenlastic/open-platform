#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Bump versions for testing.
lerna version --ci --no-git-tag-version --no-push --yes patch

# Install NPM dependencies.
lerna bootstrap --ci --concurrency 1 --registry "https://verdaccio.tenlastic.com"

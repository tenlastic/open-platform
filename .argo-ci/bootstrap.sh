#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install NPM dependencies.
time lerna \
  --scope @tenlastic/*-ui \
  --scope @tenlastic/ng-* \
  --scope angular \
  bootstrap \
  --ci \
  --concurrency 1 \
  --registry "https://verdaccio.tenlastic.com"
time lerna \
  --ignore @tenlastic/*-ui \
  --ignore @tenlastic/ng-* \
  --scope @tenlastic/* \
  --scope nodejs \
  bootstrap \
  --ci \
  --registry "https://verdaccio.tenlastic.com"
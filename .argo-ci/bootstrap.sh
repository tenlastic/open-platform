#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install NPM dependencies.
npm config set registry "https://verdaccio.tenlastic.com"
lerna bootstrap --ci

#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install NPM dependencies.
lerna bootstrap --ci

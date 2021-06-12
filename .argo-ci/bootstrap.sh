#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Install RSync.
apt-get update
apt-get install -qy rsync

# Install NPM dependencies.
rsync -a /ci-node-modules/ ./node_modules/
lerna bootstrap --ci
rsync -a --delete ./node_modules/ /ci-node-modules/

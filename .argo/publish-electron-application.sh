#!/bin/bash
set -e

# Allow Scripts to Execute (Argo Artifact Bug).
chmod +x -R ./

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Setup Lerna.
npm i -g lerna
lerna bootstrap --concurrency 1 --include-dependencies --scope @tenlastic/*-ui --scope angular

# Build and Publish Electron Applications.
lerna run --concurrency 1 electron:install
lerna run --concurrency 1 electron:windows -- -- --publish always

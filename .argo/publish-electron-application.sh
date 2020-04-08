#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Setup Lerna.
npm i -g lerna

# Build and Publish Electron Applications.
lerna run electron:install --ci
lerna run electron:windows --ci -- -- --publish always

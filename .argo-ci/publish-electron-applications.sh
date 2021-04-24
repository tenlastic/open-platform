#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Publish Electron applications.
lerna run electron:install --ci
lerna run electron:build --ci -- -- --publish always --win

#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Publish Electron applications.
npm i -g lerna
lerna run electron:install --ci
lerna run electron:build --ci -- -- --publish always --win

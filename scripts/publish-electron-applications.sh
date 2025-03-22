#!/bin/bash
set -e

# Publish Electron applications.
npm i -g lerna@5.1.4
lerna run build:electron
lerna run electron:install
lerna run electron:tsc
lerna run electron:build -- --publish always --win

#!/bin/bash
set -e

# Publish Electron applications.
npm i -g lerna
lerna run electron:install --ci
lerna run electron:build --ci -- -- --publish always --win

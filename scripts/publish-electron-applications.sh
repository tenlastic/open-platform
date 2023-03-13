#!/bin/bash
set -e

# Publish Electron applications.
npm i -g lerna
lerna run electron:install
lerna run electron:build -- --publish always --win

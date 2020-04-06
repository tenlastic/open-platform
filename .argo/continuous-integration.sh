#!/bin/bash
set -e

ROOT=$(pwd)

# Install Google Chrome.
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update && apt-get install -qy google-chrome-stable

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --include-dependencies --since
lerna run lint --ci --include-dependencies --since
lerna run --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* build
lerna run --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* build
lerna run --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* test
lerna run --ignore @tenlastic/*-ui --ignore @tenlastic/ng-* --scope @tenlastic/* test

# Merge NodeJS Test Results.
cd "${ROOT}/projects/javascript/nodejs/"
npm ci
npm run merge:junit
npm run merge:coverage
npm ci --prefix ./modules/mochawesome-merge-json/
npm run merge:mochawesome

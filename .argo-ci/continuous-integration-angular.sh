#!/bin/bash
set -e

ROOT=$(pwd)

# Run lint and build steps.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --hoist --include-dependencies --strict --scope @tenlastic/*-ui --scope @tenlastic/ng-* --scope angular --since
lerna run lint --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run build --ci --concurrency 1 --include-dependencies --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since

# Install Google Chrome.
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update && apt-get install -qy google-chrome-stable

# Run tests.
lerna run test --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since

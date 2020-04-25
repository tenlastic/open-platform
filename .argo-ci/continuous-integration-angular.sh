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
lerna bootstrap --ci --include-dependencies --scope @tenlastic/*-ui --scope @tenlastic/ng-* --scope angular --since
lerna run lint --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run build --ci --concurrency 1 --include-dependencies --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run test --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since

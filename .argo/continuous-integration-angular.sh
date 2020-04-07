#!/bin/bash
set -e

ROOT=$(pwd)

# Reset Git Changes from Argo Artifacts.
git reset --hard

# Install Google Chrome.
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update && apt-get install -qy google-chrome-stable

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna bootstrap --ci --include-dependencies --scope @tenlastic/*-ui --scope @tenlastic/ng-* --since
lerna run --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --scope angular lint
lerna run --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --scope angular build
lerna run --ci --concurrency 1 --scope @tenlastic/*-ui --scope @tenlastic/ng-* --scope angular test

# Remove Node Modules.
find . -name "node_modules" -exec rm -rf '{}' +

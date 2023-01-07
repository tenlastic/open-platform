#!/bin/bash
set -e

# Bump package versions.
npm config set unsafe-perm true
lerna version --concurrency 1 --no-push --yes patch

# Publish Node Modules to NPM.
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
lerna publish --concurrency 1 --yes from-package

# Publish Node Modules to Github.
echo "@tenlastic:registry=https://npm.pkg.github.com" > ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
lerna publish --concurrency 1 --registry "https://npm.pkg.github.com" --yes from-package

# Publish Node Modules to Verdaccio.
echo "@tenlastic:registry=https://verdaccio.tenlastic.com" > ~/.npmrc
echo "//verdaccio.tenlastic.com/:_authToken=${VERDACCIO_TOKEN}" >> ~/.npmrc
lerna publish --concurrency 1 --registry "https://verdaccio.tenlastic.com" --yes from-package

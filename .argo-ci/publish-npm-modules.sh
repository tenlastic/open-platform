#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Update Git Credentials.
git config user.email $GITHUB_USER_EMAIL
git config user.name $GITHUB_USER_NAME

# Build Applications.
npm i -g lerna
lerna bootstrap --ci
lerna run build --ci

# Publish Node Modules to NPM.
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm config set unsafe-perm true
lerna publish \
  --ci \
  --exact \
  --message "javascript-v%v [skip ci]" \
  --tag-version-prefix javascript-v \
  --yes \
  patch
npm config set unsafe-perm true

# Publish Node Modules to Github.
echo "@tenlastic:registry=https://npm.pkg.github.com" > ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

lerna publish \
  --ci \
  --registry https://npm.pkg.github.com \
  --yes \
  from-package

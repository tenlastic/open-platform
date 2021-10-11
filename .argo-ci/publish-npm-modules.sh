#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/projects/javascript/"

# Add Host Key for Github.
mkdir -p /root/.ssh/
ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts
cp /tmp/secrets/cd-ssh-keys/id_rsa /root/.ssh/id_rsa

# Update Git Credentials.
git config --global url."ssh://git@github.com".insteadOf "https://github.com" || true
git config --global gc.auto 0 || true
git config user.email $GITHUB_USER_EMAIL
git config user.name $GITHUB_USER_NAME

# Publish Node Modules to NPM.
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm config set unsafe-perm true
lerna publish --ci --exact --message "javascript-v%v [skip ci]" --tag-version-prefix "javascript-v" --yes patch
npm config set unsafe-perm false

# Publish Node Modules to Github.
echo "@tenlastic:registry=https://npm.pkg.github.com" > ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
lerna publish --ci --registry "https://npm.pkg.github.com" --yes from-package

# Publish Node Modules to Verdaccio.
echo "@tenlastic:registry=https://verdaccio.tenlastic.com" > ~/.npmrc
echo "//verdaccio.tenlastic.com/:_authToken=${VERDACCIO_TOKEN}" >> ~/.npmrc
lerna publish --ci --registry "https://verdaccio.tenlastic.com" --yes from-package

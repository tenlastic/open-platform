#!/bin/bash
set -e

DIRECTORY="${1}"
FILE="../../../kubernetes/kustomize/base/static/angular/${DIRECTORY}.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump tag to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${FILE}"

# Bump the version label to the most recent version.
sed -i \
  -e "s|\(version: \).*|\1${VERSION}|" \
  "${FILE}"

# Add file to Git commit.
git add "${FILE}"

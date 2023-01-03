#!/bin/bash
set -e

DIRECTORY="${1}"
FILE="../../../kubernetes/kustomize/base/static/angular/${DIRECTORY}.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${FILE}"

# Add file to Git commit.
git add "${FILE}"

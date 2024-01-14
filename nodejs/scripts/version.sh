#!/bin/bash
set -e

DIRECTORY="${1}"
FILE="${2}"
PATH="../../../kustomize/base/static/${DIRECTORY}/${FILE}.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${PATH}"

# Add file to Git commit.
git add "${PATH}"

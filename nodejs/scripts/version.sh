#!/bin/bash
set -e

DIRECTORY="${1}"
FILE="${2}"
FILEPATH="../../../kustomize/base/static/${DIRECTORY}/${FILE}.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${FILEPATH}"

# Add file to Git commit.
git add "${FILEPATH}"

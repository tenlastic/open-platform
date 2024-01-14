#!/bin/bash
set -e

FILEPATH="../../../kustomize/overlays/production/static/cronworkflows/e2e.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${FILEPATH}"

# Add file to Git commit.
git add "${FILEPATH}"

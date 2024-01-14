#!/bin/bash
set -e

PATH="../../../kustomize/overlays/production/static/cronworkflows/e2e.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${PATH}"

# Add file to Git commit.
git add "${PATH}"

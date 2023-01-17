#!/bin/bash
set -e

FILE="../../../kustomize/overlays/production/static/argo/cron-workflows/e2e.yaml"
VERSION=$(node -p "require('./package.json').version")

# Bump image to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "${FILE}"

# Add file to Git commit.
git add "${FILE}"

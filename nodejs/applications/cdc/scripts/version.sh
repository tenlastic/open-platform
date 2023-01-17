#!/bin/bash
set -e

version () {
  DIRECTORY="${1}"
  FILE="../../../kustomize/base/static/nodejs/${DIRECTORY}.yaml"
  VERSION=$(node -p "require('./package.json').version")

  # Bump image to the most recent version.
  sed -i \
    -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
    "${FILE}"

  # Add file to Git commit.
  git add "${FILE}"
}

version aggregation-api-cdc
version api-cdc
version social-api-cdc
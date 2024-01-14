#!/bin/bash
set -e

version () {
  FILE="${1}"
  PATH="../../../kustomize/base/static/statefulsets/${FILE}.yaml"
  VERSION=$(node -p "require('./package.json').version")

  # Bump image to the most recent version.
  sed -i \
    -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
    "${PATH}"

  # Add file to Git commit.
  git add "${PATH}"
}

version aggregation-api-cdc
version api-cdc
version social-api-cdc

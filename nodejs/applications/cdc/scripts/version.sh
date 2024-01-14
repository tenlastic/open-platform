#!/bin/bash
set -e

version () {
  FILE="${1}"
  FILEPATH="../../../kustomize/base/static/statefulsets/${FILE}.yaml"
  VERSION=$(node -p "require('./package.json').version")

  # Bump image to the most recent version.
  sed -i \
    -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
    "${FILEPATH}"

  # Add file to Git commit.
  git add "${FILEPATH}"
}

version aggregation-api-cdc
version api-cdc
version social-api-cdc

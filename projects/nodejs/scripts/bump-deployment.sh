#!/bin/bash
set -e

DIRECTORY="${1}"
VERSION=$(node -p "require('./package.json').version")

sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "../../../../kubernetes/infrastructure/${DIRECTORY}/deployment.yml"
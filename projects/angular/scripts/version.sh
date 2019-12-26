#!/bin/bash
set -e

DIRECTORY="${1}"
VERSION=$(node -p "require('./package.json').version")

# Bump tag to the most recent version.
sed -i \
  -e "s|\(image: tenlastic/[^:]*:\).*|\1${VERSION}|" \
  "../../../../kubernetes/infrastructure/${DIRECTORY}/deployment.yml"

# Add file to Git commit.
git add "../../../../kubernetes/infrastructure/${DIRECTORY}/deployment.yml"
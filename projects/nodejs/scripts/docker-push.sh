#!/bin/bash
set -e

REPOSITORY="${1}"
TAG=$(node -p "require('./package.json').version")

IMAGE_ID=$(docker images $REPOSITORY:$TAG --format "{{.ID}}")
URL="docker.pkg.github.com/tenlastic/open-platform/${REPOSITORY}"

# Authenticate to Github Package Registry.
docker login docker.pkg.github.com \
  -u "${GITHUB_USER_EMAIL}" \
  -p "${NPM_TOKEN}"

# Tag and push version to Github Package Registry.
docker tag "${IMAGE_ID}" "${URL}:docker-base-image"
docker push "${URL}:docker-base-image"

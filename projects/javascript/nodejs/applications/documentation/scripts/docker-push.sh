#!/bin/bash
set -e

PROJECT="${1}"
REPOSITORY="tenlastic/${PROJECT}"
TAG=$(node -p "require('./package.json').version")

# Authenticate to Github Package Registry.
docker login \
  -u "${DOCKER_HUB_USERNAME}" \
  -p "${DOCKER_HUB_PASSWORD}"

# Tag and push to Docker Hub.
docker push -q "${REPOSITORY}:${TAG}"
docker push -q "${REPOSITORY}:latest"

IMAGE_ID=$(docker images $REPOSITORY:$TAG --format "{{.ID}}")
URL="docker.pkg.github.com/tenlastic/open-platform/${PROJECT}"

# Authenticate to Github Package Registry.
docker login docker.pkg.github.com \
  -u "${GITHUB_USER_EMAIL}" \
  -p "${GITHUB_TOKEN}"

# Tag and push version to Github Package Registry.
docker tag "${IMAGE_ID}" "${URL}:${TAG}"
docker push -q "${URL}:${TAG}"

# Tag and push latest version to Github Package Registry.
docker tag "${IMAGE_ID}" "${URL}:latest"
docker push -q "${URL}:latest"
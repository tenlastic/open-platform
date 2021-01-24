#!/bin/bash
set -e

ROOT=$(pwd)

function build_and_push_docker_image {
  DIRECTORY="${1}"
  REPOSITORY="${2}"

  cd "${ROOT}/${DIRECTORY}"
  docker build -t "${REPOSITORY}:latest" ./

  IMAGE_ID=$(docker images ${REPOSITORY}:latest --format "{{.ID}}")
  URL="tenlastic/${REPOSITORY}"

  # Authenticate to Github Package Registry.
  docker login \
    -u "${DOCKER_HUB_USERNAME}" \
    -p "${DOCKER_HUB_PASSWORD}"

  # Tag and push latest version to Docker Hub.
  docker tag "${IMAGE_ID}" "${URL}:latest"
  docker push "${URL}:latest"

  URL="docker.pkg.github.com/tenlastic/open-platform/${REPOSITORY}"

  # Authenticate to Github Package Registry.
  docker login docker.pkg.github.com \
    -u "${GITHUB_USER_EMAIL}" \
    -p "${GITHUB_TOKEN}"

  # Tag and push latest version to Github Package Registry.
  docker tag "${IMAGE_ID}" "${URL}:latest"
  docker push "${URL}:latest"
}

build_and_push_docker_image ./dockerfiles/development-cli/ development-cli
build_and_push_docker_image ./dockerfiles/mongo-replica-set/ mongo-replica-set
build_and_push_docker_image ./dockerfiles/node-chrome-lerna/ node-chrome-lerna

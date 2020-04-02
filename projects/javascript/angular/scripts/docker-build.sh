#!/bin/bash
set -e

DIRECTORY="${1}"
REPOSITORY="tenlastic/${2}"
TAG=$(node -p "require('./package.json').version")

docker build \
  -t "${REPOSITORY}:${TAG}" \
  -t "${REPOSITORY}:latest" \
  --build-arg "DIRECTORY=${DIRECTORY}" \
  ../../
  
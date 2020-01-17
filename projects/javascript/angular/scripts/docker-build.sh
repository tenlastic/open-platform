#!/bin/bash
set -e

DIRECTORY="${1}"
REPOSITORY="${2}"
TAG=$(node -p "require('./package.json').version")

docker build \
  -t "${REPOSITORY}:${TAG}" \
  --build-arg "DIRECTORY=${DIRECTORY}" \
  ../../
  
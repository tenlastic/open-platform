#!/bin/bash
set -e

REPOSITORY="${1}"
TAG=$(node -p "require('./package.json').version")

docker build \
  -f "../../Dockerfile" \
  -t "${REPOSITORY}:${TAG}" \
  --build-arg "NPM_TOKEN=${NPM_TOKEN}" \
  ./
#!/bin/bash
set -e

REPOSITORY="${1}"
TAG=$(node -p "require('./package.json').version")

docker build \
  -f "../../Dockerfile" \
  -t "${REPOSITORY}:${TAG}" \
  ./
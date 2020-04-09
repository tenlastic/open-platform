#!/bin/bash
set -e

REPOSITORY="tenlastic/${1}"
TAG=$(node -p "require('./package.json').version")

docker build \
  -f "../../Dockerfile" \
  -q \
  -t "${REPOSITORY}:${TAG}" \
  -t "${REPOSITORY}:latest" \
  ./
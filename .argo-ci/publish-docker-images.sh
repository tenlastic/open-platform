#!/bin/bash
set -e

ROOT=$(pwd)

# Install Docker Client.
VER="18.06.3-ce"
curl -L -o /tmp/docker-$VER.tgz https://download.docker.com/linux/static/stable/x86_64/docker-$VER.tgz
tar -xz -C /tmp -f /tmp/docker-$VER.tgz
mv /tmp/docker/* /usr/bin

# Build and Push Docker Images.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna run docker:build --ci --concurrency 1
lerna run docker:push --ci --concurrency 1

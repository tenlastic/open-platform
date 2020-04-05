#!/bin/bash
set -e

# Allow Scripts to Execute (Argo Artifact Bug).
chmod +x -R ./

ROOT=$(pwd)

# Install Docker Client.
VER="18.06.3-ce"
curl -L -o /tmp/docker-$VER.tgz https://download.docker.com/linux/static/stable/x86_64/docker-$VER.tgz
tar -xz -C /tmp -f /tmp/docker-$VER.tgz
mv /tmp/docker/* /usr/bin

# Build and Push Docker Images.
cd "${ROOT}/projects/javascript/"
npm i -g lerna
lerna run --concurrency 1 docker:build
lerna run --concurrency 1 docker:push
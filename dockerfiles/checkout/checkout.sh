#!/bin/sh
set -e

# Add Host Key for Github.
mkdir -p /root/.ssh/
ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts
cp "${PRIVATE_KEY}" /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa

# Use SSH instead of HTTPS.
git config --global gc.auto 0 || true
git config --global url."ssh://git@github.com".insteadOf "https://github.com" || true

# Clone repository and reset to specific revision.
git clone "${REPOSITORY}" "${DIRECTORY}"
cd "${DIRECTORY}"
git fetch --all
git reset --hard "${REVISION}"
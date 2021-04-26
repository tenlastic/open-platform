#!/bin/bash
set -e

# Add Host Key for Github.
mkdir -p /root/.ssh/
ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts
cp /tmp/secrets/cd-ssh-keys/id_rsa /root/.ssh/id_rsa

# Use SSH instead of HTTPS.
git config --global url."ssh://git@github.com".insteadOf "https://github.com" || true
git config --global gc.auto 0 || true

# Clone repository and reset to specific revision.
git clone {{inputs.parameters.repo}} /workspace/open-platform/
cd /workspace/open-platform/
git fetch --all
git reset --hard {{inputs.parameters.revision}}
#!/bin/bash
set -e

# Add Host Key for Github.
mkdir -p /root/.ssh/
ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts
cp /tmp/secrets/continuous-deployment/id_rsa /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa

# Update Git Credentials.
git config --global gc.auto 0 || true
git config --global url."ssh://git@github.com".insteadOf "https://github.com" || true
git config user.email $GITHUB_USER_EMAIL
git config user.name $GITHUB_USER_NAME

# Commit changes to Git.
git pull --rebase origin master
git push --atomic --follow-tags --no-verify origin master
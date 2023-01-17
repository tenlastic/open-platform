#!/bin/bash
set -e

TAG=$(git describe --match "nodejs-v*" --abbrev=0 HEAD)
REVISION=$(git log -1 --format=format:"%H" $TAG)

# Lint, build, and test NodeJS applications.
lerna run lint --since $REVISION
lerna run build --include-dependencies --since $REVISION
lerna run test --since $REVISION

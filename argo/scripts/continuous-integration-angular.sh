#!/bin/bash
set -e

TAG=$(git describe --match "angular-v*" --abbrev=0 HEAD)
REVISION=$(git log -1 --format=format:"%H" $TAG)

# Lint, test, and build Angular applications.
lerna run lint --since $REVISION
lerna run build --concurrency 1 --include-dependencies --since $REVISION
lerna run test --concurrency 1 --since $REVISION

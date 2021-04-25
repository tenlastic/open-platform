#!/bin/bash
set -e

# Build application if not already built.
if [ ! -d "./dist/" ]; then
  lerna run build --ci --include-dependencies --scope "${SCOPE}"
fi

#!/bin/bash
set -e

# Build and run MongoDB migrations.
lerna run \
  --include-dependencies \
  --scope @tenlastic/aggregation-api-migrations \
  --scope @tenlastic/api-migrations \
  build
lerna run \
  --scope @tenlastic/aggregation-api-migrations \
  --scope @tenlastic/api-migrations \
  start

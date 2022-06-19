#!/bin/bash
set -e

# Build and run MongoDB migrations.
lerna run build --ci --include-dependencies --scope @tenlastic/migrations --scope nodejs
npm run start

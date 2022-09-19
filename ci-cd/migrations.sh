#!/bin/bash
set -e

# Build and run MongoDB migrations.
lerna run build --include-dependencies --scope @tenlastic/migrations
npm run start

#!/bin/bash
set -e

# Remove old build.
rm -rf dist/

# Build Typescript files.
tsc -p ./tsconfig.app.json

# Copy non-Typescript files.
cd ./src/
find . -type f -not -name \*.ts -exec cp --parents '{}' '../dist' ';'

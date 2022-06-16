#!/bin/bash
set -e

# If ./dist/ directory does not exist, remove tsbuildinfo file for fresh build.
if [ ! -d "./dist/" ]; then
  rm -f tsconfig.app.tsbuildinfo
fi

# Build Typescript files.
tsc -p ./tsconfig.app.json

# Copy non-Typescript files.
cd ./src/
find . -type f -not -name \*.ts -exec cp --parents '{}' '../dist' ';'

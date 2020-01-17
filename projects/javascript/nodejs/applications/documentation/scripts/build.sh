#!/bin/bash
set -e

# Create public directory if it does not exist.
mkdir -p ./dist/

# Merge swagger files.
merge-yaml -i swagger.yml ../*/src/**/swagger.yml -o ./dist/swagger.yml

# Alphabetize Output.
yml-sorter --input ./dist/swagger.yml

# Copy Files.
cpx "./public/*" "./dist/"
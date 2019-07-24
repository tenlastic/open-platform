#!/bin/bash
set -e

# Create public directory if it does not exist.
mkdir -p ./dist/public/

# Merge swagger files.
merge-yaml -i swagger.yml src/**/swagger.yml -o ./public/swagger.yml

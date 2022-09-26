#!/bin/bash
set -e

# Merge swagger files.
merge-yaml \
  -i swagger.yml \
  ./src/mongodb/**/swagger.yml \
  ./src/routes/**/swagger.yml \
  -o ./public/swagger.yml

# Alphabetize Output.
yml-sorter --input ./public/swagger.yml

# Convert to JSON.
yaml2json ./public/swagger.yml > ./public/swagger.json

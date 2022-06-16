#!/bin/bash
set -e

# Merge swagger files.
merge-yaml \
  -i swagger.yml \
  ../../modules/mongoose-models/src/**/swagger.yml \
  ../database/src/**/swagger.yml \
  ./src/handlers/**/swagger.yml \
  -o ./src/public/swagger.yml

# Alphabetize Output.
yml-sorter --input ./src/public/swagger.yml

# Convert to JSON.
yaml2json ./src/public/swagger.yml > ./src/public/swagger.json

#!/bin/bash
set -e

# Copy ./src/ directory to ./dist/.
cp -r ./src/. ./dist/

# Merge swagger files.
merge-yaml \
  -i ./swagger.yml \
  ../../modules/mongoose/src/**/*.yml \
  ../aggregation-api/src/**/swagger.yml \
  ../api/src/**/swagger.yml \
  ../namespace-api/src/**/swagger.yml \
  ../social-api/src/**/swagger.yml \
  -o ./dist/swagger.yml

# Alphabetize Output.
yml-sorter --input ./dist/swagger.yml

# Convert to JSON.
yaml2json ./dist/swagger.yml > ./dist/swagger.json

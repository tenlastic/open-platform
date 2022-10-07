#!/bin/bash
set -e

# Copy ./src/ directory to ./dist/.
cp -r ./src/. ./dist/

# Merge swagger files.
merge-yaml \
  -i ./swagger.yml \
  ../api/src/mongodb/**/swagger.yml \
  ../api/src/web-server/**/swagger.yml \
  ../namespace-api/src/mongodb/**/swagger.yml \
  ../namespace-api/src/web-server/**/swagger.yml \
  -o ./dist/swagger.yml

# Alphabetize Output.
yml-sorter --input ./dist/swagger.yml

# Convert to JSON.
yaml2json ./dist/swagger.yml > ./dist/swagger.json

#!/bin/bash
set -e

# Create the distribution directory.
mkdir -p ./dist/swagger/

# Merge API swagger files.
merge-yaml \
  -i ./swagger.yml \
  ../../modules/mongoose/src/**/*.yml \
  ../aggregation-api/src/web-server/**/swagger.yml \
  ../api/src/web-server/**/swagger.yml \
  ../namespace-api/src/web-server/**/swagger.yml \
  ../social-api/src/web-server/**/swagger.yml \
  -o ./dist/swagger/api.yml

# Merge Web Socket swagger files.
merge-yaml \
  -i ./swagger.yml \
  ../aggregation-api/src/web-socket-server/**/swagger.yml \
  ../api/src/web-socket-server/**/swagger.yml \
  ../namespace-api/src/web-socket-server/**/swagger.yml \
  ../social-api/src/web-socket-server/**/swagger.yml \
  -o ./dist/swagger/web-sockets.yml

# Alphabetize Output.
yml-sorter --input ./dist/swagger/api.yml
yml-sorter --input ./dist/swagger/web-sockets.yml

# Convert to JSON.
yaml2json ./dist/swagger/api.yml > ./dist/swagger/api.json
yaml2json ./dist/swagger/web-sockets.yml > ./dist/swagger/web-sockets.json

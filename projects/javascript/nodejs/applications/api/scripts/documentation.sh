#!/bin/bash
set -e

# Merge swagger files.
merge-yaml -i swagger.yml ./src/**/swagger.yml -o ./src/public/swagger.yml

# Alphabetize Output.
yml-sorter --input ./src/public/swagger.yml

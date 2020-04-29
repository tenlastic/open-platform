#!/bin/bash
set -e

# Merge swagger files.
merge-yaml -i swagger.yml ./src/**/swagger.yml -o ./public/swagger.yml

# Alphabetize Output.
yml-sorter --input ./public/swagger.yml

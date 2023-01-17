#!/bin/bash
set -e

# Install JSON module without printing to stdout.
npm i -g json &> /dev/null

# Explicitly use local Lerna version to avoid "info cli using local version of lerna" message.
JSON=$(./node_modules/.bin/lerna list --all --json --loglevel silent --scope @tenlastic/* 2> /dev/null || echo "[]")
echo "${JSON}" | json -0 -c 'this.private === true' -e 'this.name = this.name.replace("@tenlastic/","")'
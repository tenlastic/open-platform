#!/bin/bash
set -e

# Load environment variables if file exists.
if [ -f ../../settings.sh ]; then
  source ../../settings.sh
fi
if [ -f ./settings.sh ]; then
  source ./settings.sh
fi

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --interval 1000 --poll ./src/index.ts
else
  ts-node ./src/index.ts
fi

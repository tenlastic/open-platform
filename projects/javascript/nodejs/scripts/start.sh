#!/bin/bash
set -e

# Load environment variables if file exists.
if [ -f ../../settings.sh ]; then
  source ../../settings.sh
fi
if [ -f ./settings.sh ]; then
  source ./settings.sh
fi

# Run migrations if script is present.
npm run --if-present migrations up

ts-node ./src/index.ts $@

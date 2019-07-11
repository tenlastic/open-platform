#!/bin/bash
set -e

# Load environment variables if file exists.
if [ -f ../../settings.sh ]; then
  source ../../settings.sh
fi

# Run migrations if script is present.
if [[ $(yarn run --non-interactive | grep "^  migrations" | wc -l) > 0 ]]; then
  yarn migrations
fi

sls offline start

#!/bin/bash
set -e

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --interval 10000 --poll ./src/index.ts $@
else
  ts-node ./src/index.ts $@
fi

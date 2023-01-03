#!/bin/bash
set -e

onchange -i -k -p 1000 "./src/**" -- bash -c "./scripts/build.sh && http-server --cors '*' -p 80 ./dist/"

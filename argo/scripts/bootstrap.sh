#!/bin/bash
set -e

# Install NPM dependencies.
lerna bootstrap --ci --registry "https://verdaccio.tenlastic.com"

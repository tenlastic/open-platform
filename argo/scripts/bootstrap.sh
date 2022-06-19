#!/bin/bash
set -e

# Install NPM dependencies.
lerna bootstrap --registry "https://verdaccio.tenlastic.com"

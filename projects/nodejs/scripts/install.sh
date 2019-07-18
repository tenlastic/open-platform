#!/bin/bash
set -e

# Save the package to current package.
echo "Adding $1 to current package..."
npm i --save-exact $1

# Save the @types package to root package.
echo "Adding @types/$1 to root package..."
cd ../../
npm i -D --save-exact @types/$1 || echo "Could not add @types/$1 to root package."

# Restore Lerna symlinks.
./node_modules/.bin/lerna link

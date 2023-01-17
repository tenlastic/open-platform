#!/bin/bash
set -e

cd "${CONTEXT}"

# Build the application.
lerna run build --include-dependencies --scope "${SCOPE}"


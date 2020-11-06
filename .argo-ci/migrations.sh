#!/bin/bash
set -e

ROOT=$(pwd)

# Run Javascript Applications.
cd "${ROOT}/projects/javascript/applications/migrations/"
npm run start

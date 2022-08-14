#!/bin/bash
set -e

# Remove the previous test results.
rm -rf ./test-results/mochawesome/
rm -rf ./test-results/mochawesome-e2e/

# Merge regular JSON.
cd ./modules/mochawesome/
npm start -- \
  --output "../../test-results/mochawesome/mochawesome.json" \
  --pattern "../../?(applications|modules)/*/test-results/mochawesome/*.json"
cd ../../

# Merge end-to-end JSON.
cd ./modules/mochawesome/
npm start -- \
  --output "../../test-results/mochawesome-e2e/mochawesome.json" \
  --pattern "../../?(applications|modules)/*/test-results/mochawesome-e2e/*.json"
cd ../../

# Generate HTML report from regular JSON files.
if [ -f ./test-results/mochawesome/mochawesome.json ]; then
  cd ./test-results/mochawesome/
  marge mochawesome.json --reportDir ./
  cd ../../
fi

# Generate HTML report from end-to-end JSON files.
if [ -f ./test-results/mochawesome-e2e/mochawesome.json ]; then
  cd ./test-results/mochawesome-e2e/
  marge mochawesome.json --reportDir ./
  cd ../../
fi

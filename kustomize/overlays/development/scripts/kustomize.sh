#!/bin/bash
set -e

# Create remaining resources.
until kustomize build ./ | kubectl apply -f -
do
  echo "Error running Kustomize. Retrying in 5 seconds..."
  sleep 5
done

# Apply local, uncommitted secret files.
for FILE in `find ./ -name '*.secret.yaml' -type f`; do
  kubectl apply -f $FILE
done

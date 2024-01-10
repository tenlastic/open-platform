#!/bin/bash
set -e

# Create resources.
kustomize build ./ | kubectl apply -f -

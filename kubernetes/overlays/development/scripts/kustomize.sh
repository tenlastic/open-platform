#!/bin/bash
set -e

# Create remaining resources.
kustomize build ./ | kubectl apply -f -

# Apply local, uncommitted secret files. (Kubectl PR: https://github.com/kubernetes/kubernetes/pull/102265)
kubectl apply $(find ../local/ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
kubectl apply $(find ./ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
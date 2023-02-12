#!/bin/bash
set -e

# Create remaining resources.
until kustomize build ./ | kubectl apply -f -
do
  echo "Error running Kustomize. Retrying in 5 seconds..."
  sleep 5
done

# Apply local, uncommitted secret files. (Kubectl PR: https://github.com/kubernetes/kubernetes/pull/102265)
kubectl apply $(find ../../base/ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
kubectl apply $(find ../local/ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
kubectl apply $(find ./ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
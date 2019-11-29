#/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the Argo namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Create the Argo RoleBinding.
kubectl apply -f "${DIRNAME}/manifests/role-binding.yml"

# Install Argo.
kubectl apply -n argo -f "${DIRNAME}/manifests/install.yaml"

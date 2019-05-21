#/usr/bin/env bash
set -e

# Create the Argo namespace.
kubectl apply -f ./kubernetes/objects/argo/namespace.yml

# Create the Argo RoleBinding.
kubectl apply -f ./kubernetes/objects/argo/role-binding.yml

# Install Argo.
kubectl apply -n argo -f ./kubernetes/objects/argo/install.yaml

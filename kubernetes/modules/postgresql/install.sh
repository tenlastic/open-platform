#/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the PostgreSQL namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install PostgreSQL Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade postgresql stable/postgresql \
  --install \
  --namespace "postgresql" \
  --values "${DIRNAME}/helm/values.yml"

# Install PostgreSQL manifests.
kubectl apply -f "${DIRNAME}/manifests/"

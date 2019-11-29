#/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the MongoDB namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install MongoDB Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade mongodb stable/mongodb \
  --install \
  --namespace "mongodb" \
  --values "${DIRNAME}/helm/values.yml"

# Install MongoDB manifests.
kubectl apply -f "${DIRNAME}/manifests/"

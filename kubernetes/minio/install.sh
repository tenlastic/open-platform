#/usr/bin/env bash
set -e

DIR=$(dirname $0)

# Create the MinIO namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install MinIO Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade minio stable/minio \
  --install \
  --namespace "minio" \
  --values "${DIRNAME}/helm/values.yml"

# Install MinIO Dashboards.
kubectl apply -f "${DIRNAME}/manifests/"

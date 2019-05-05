#/usr/bin/env bash
set -e

# Create the MinIO namespace.
kubectl apply -f ./kubernetes/objects/minio/namespace.yml

# Install MinIO Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade minio stable/minio \
  --install \
  --namespace "minio" \
  --values "./helm/values/minio.yml"

# Install MinIO Dashboards.
kubectl apply -f ./kubernetes/objects/minio/

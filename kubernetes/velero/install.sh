#!/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the Velero namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Create GCP Velero Secret.
"${DIRNAME}/../../gcloud/scripts/get-service-account-key.sh" velero
kubectl create secret generic cloud-credentials \
 --from-file "${DIRNAME}/../../gcloud/service-accounts/velero.json" \
 --namespace "velero"

# Install Velero.
kubectl apply -f "${DIRNAME}/manifests/prerequisites.yml"
kubectl apply -f "${DIRNAME}/manifests/"

# Set up backups.
"${DIRNAME}/../../bin/velero/velero" schedule create minio-backup \
  --include-namespaces "minio" \
  --schedule "0 8 * * *"
"${DIRNAME}/../../bin/velero/velero" schedule create mongodb-backup \
  --include-namespaces "mongodb" \
  --schedule "0 8 * * *"
"${DIRNAME}/../../bin/velero/velero" schedule create redis-backup \
  --include-namespaces "redis" \
  --schedule "0 8 * * *"

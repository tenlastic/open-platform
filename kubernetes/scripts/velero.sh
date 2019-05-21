#!/usr/bin/env bash
set -e

# Create the Velero namespace.
kubectl apply -f ./kubernetes/objects/velero/namespace.yml

# Create GCP Velero Secret.
./gcloud/scripts/get-service-account-key.sh velero
kubectl create secret generic cloud-credentials \
 --from-file "./gcloud/service-accounts/velero.json" \
 --namespace "velero"

# Install Velero.
kubectl apply -f ./kubernetes/objects/velero/prerequisites.yml
kubectl apply -f ./kubernetes/objects/velero/

# Set up backups.
./bin/velero/velero schedule create minio-backup \
  --include-namespaces "minio" \
  --schedule "0 8 * * *"
./bin/velero/velero schedule create mongodb-backup \
  --include-namespaces "mongodb" \
  --schedule "0 8 * * *"
./bin/velero/velero schedule create redis-backup \
  --include-namespaces "redis" \
  --schedule "0 8 * * *"

#!/bin/bash
set -e

CLUSTER_NAME="staging"
CLUSTER_ZONE="us-central1-a"

# Create a Kubernetes Cluster.
gcloud beta container clusters create "${CLUSTER_NAME}" \
  --addons "NetworkPolicy" \
  --cluster-version "1.12.7-gke.7" \
  --disk-size "20GB" \
  --enable-autorepair \
  --enable-autoscaling \
  --enable-autoupgrade \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --enable-ip-alias \
  --machine-type "n1-standard-2" \
  --max-nodes "2" \
  --metadata "disable-legacy-endpoints=true" \
  --min-nodes "1" \
  --no-enable-basic-auth \
  --no-issue-client-certificate \
  --num-nodes "1" \
  --zone "${CLUSTER_ZONE}"

# Configure Kubectl to connect to the new cluster.
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --zone "${CLUSTER_ZONE}"

#!/bin/bash
set -e

CLUSTER_NAME="staging"
CLUSTER_ZONE="us-central1-a"

gcloud container node-pools create preemptible-pool \
  --cluster "$CLUSTER_NAME" \
  --disk-size "20G" \
  --enable-autorepair \
  --enable-autoscaling \
  --enable-autoupgrade \
  --machine-type "g1-small" \
  --max-nodes "5" \
  --metadata "disable-legacy-endpoints=true" \
  --min-nodes "2" \
  --num-nodes "2" \
  --preemptible \
  --scopes "cloud-platform" \
  --zone $CLUSTER_ZONE

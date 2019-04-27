#!/bin/bash
set -e

# Create the Managed Zone.
# gcloud dns managed-zones create tenlastic \
#   --dns-name "tenlastic.com."

# Get the IP Address.
IP_ADDRESS=$(
  kubectl get svc istio-ingressgateway \
    -n istio-system \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
)

# Start a transaction to add Record Sets.
gcloud dns record-sets transaction start \
  --zone "tenlastic"

# Create an A Record for the Static IP Address wildcard.
gcloud dns record-sets transaction add "${IP_ADDRESS}" \
  --name "*.tenlastic.com." \
  --ttl "300" \
  --type "A" \
  --zone "tenlastic"

# Execute the transaction.
gcloud dns record-sets transaction execute \
  --zone tenlastic

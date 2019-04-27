#!/usr/bin/env bash
set -e

IP_ADDRESS=$(
  gcloud compute addresses describe tenlastic-ip-address \
    --format json \
    --region us-central1 \
    | jq -r '.address'
)

helm install stable/nginx-ingress \
  --name nginx-ingress \
  --set controller.service.loadBalancerIP="${IP_ADDRESS}"

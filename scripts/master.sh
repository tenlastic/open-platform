#!/usr/bin/env bash
set -e

# Deploy Kubernetes cluster.
export GOOGLE_CREDENTIALS=$(cat ./gcloud/service-accounts/terraform.json)
cd ./gcloud/terraform/production
terraform init -backend-config="./backend.example.tfvars"
terraform apply
cd ../../../

# Connect to cluster.
gcloud container clusters get-credentials primary \
  --zone "us-central1-a"

# Install Tiller.
./kubernetes/scripts/tiller.sh

# Install CertManager.
./kubernetes/scripts/cert-manager.sh

# Install Istio.
./kubernetes/scripts/istio.sh

# Create Wildcard Certificate.
kubectl apply -f ./kubernetes/objects/istio/certificate.yml

# Wait for certificate to provision.
echo "Waiting for certificate..."
sleep 60

# Restart Istio Ingressgateway to reload certificate.
export TIMESTAMP=$(date +%s)
kubectl patch deployment -n istio-system  istio-ingressgateway \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"date\":\"${TIMESTAMP}\"}}}}}"

# Add extra storage classes.
kubectl apply -f ./kubernetes/objects/storage-classes/

# Install MongoDB.
./kubernetes/scripts/mongodb.sh

# Install Redis.
./kubernetes/scripts/redis.sh

# Install Kafka.
./kubernetes/scripts/kafka.sh

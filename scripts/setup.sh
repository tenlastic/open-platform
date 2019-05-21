#!/usr/bin/env bash
set -e

# Setup Google Credentials for Terraform.
export GOOGLE_CREDENTIALS=$(cat ./gcloud/service-accounts/terraform.json)

# Deploy IAM profiles.
# cd ./gcloud/terraform/custom-roles/
# terraform init -backend-config="./backend.example.tfvars"
# terraform apply -auto-approve
# cd ../../../

# Deploy Kubernetes cluster.
cd ./gcloud/terraform/cluster/
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
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

# Upload Grafana dashboards.
./kubernetes/scripts/grafana-dashboards.sh

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

# # Install Kafka.
# ./kubernetes/scripts/kafka.sh

# Install MinIO.
./kubernetes/scripts/minio.sh

# # Install PostgreSQL.
# ./kubernetes/scripts/postgresql.sh

# Install Redis.
./kubernetes/scripts/redis.sh

# Install Velero.
./kubernetes/scripts/velero.sh

# Install Argo.
./kubernetes/scripts/argo.sh

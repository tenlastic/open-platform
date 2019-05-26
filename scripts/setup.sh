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

# Add extra storage classes.
kubectl apply -f ./kubernetes/storage-classes/

# Install Tiller.
./kubernetes/tiller/install.sh

# Install Argo.
# ./kubernetes/argo/install.sh

# Install Grafana.
./kubernetes/grafana/install.sh

# Install Istio.
./kubernetes/istio/install.sh

# Install Kafka.
# ./kubernetes/kafka/install.sh

# Install MongoDB.
./kubernetes/mongodb/install.sh

# Install MinIO.
./kubernetes/minio/install.sh

# Install PostgreSQL.
./kubernetes/postgresql/install.sh

# Install Redis.
./kubernetes/redis/install.sh

# Install Velero.
./kubernetes/velero/install.sh

#!/bin/bash
set -e

# Allow Scripts to Execute (Argo Artifact Bug).
chmod +x -R ./

ROOT=$(pwd)

# Update Custom Roles.
cd "${ROOT}/gcp/terraform/custom-roles/"
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve

# Update Cluster.
cd "${ROOT}/gcp/terraform/cluster/"
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
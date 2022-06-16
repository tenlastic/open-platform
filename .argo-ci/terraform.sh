#!/bin/bash
set -e

ROOT=$(pwd)
cd "${ROOT}/gcp/terraform/"

# Apply Terraform changes.
terraform init
terraform apply -auto-approve

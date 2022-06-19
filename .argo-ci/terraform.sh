#!/bin/bash
set -e

# Apply Terraform changes.
terraform init
terraform apply -auto-approve

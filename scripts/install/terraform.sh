#!/usr/bin/env bash
set -e

# Install download tools.
sudo apt-get update
sudo apt-get install wget unzip

# Download and unzip Terraform.
wget https://releases.hashicorp.com/terraform/0.11.13/terraform_0.11.13_linux_amd64.zip
sudo unzip ./terraform_0.11.13_linux_amd64.zip -d /usr/local/bin/

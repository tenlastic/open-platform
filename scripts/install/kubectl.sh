#!/usr/bin/env bash
set -e

# Download Kubectl.
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl

# Allow execution and move to PATH.
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
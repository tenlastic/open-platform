#!/usr/bin/env bash
set -e

# Install Kustomize.
curl -s https://api.github.com/repos/kubernetes-sigs/kustomize/releases/latest |\
  grep browser_download |\
  grep linux |\
  cut -d '"' -f 4 |\
  xargs curl -O -L

# Move the installation to a more permanent location.
sudo mv kustomize_*_linux_amd64 /opt/kustomize
sudo chmod u+x /opt/kustomize

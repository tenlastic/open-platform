#/usr/bin/env bash
set -e

# Create Velero directory.
mkdir -p ./bin/velero/
cd ./bin/velero/

# Download and extract Velero to binaries directory.
wget https://github.com/heptio/velero/releases/download/v0.11.0/velero-v0.11.0-linux-amd64.tar.gz \
  --output-document ./velero.tar.gz

# Extract to binaries directory.
tar -xzf ./velero.tar.gz

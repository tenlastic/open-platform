#!/bin/bash

# Configuration
HELP="Usage: $0 -d directory -n namespace -p password -u username"
LABEL="app.kubernetes.io/name=minio"
MC_ALIAS="minio"
PORT="9000"

# Parse flags
while getopts "d:n:p:u:" opt; do
  case $opt in
    d) DIRECTORY="$OPTARG" ;;
    n) NAMESPACE="$OPTARG" ;;
    p) PASSWORD="$OPTARG" ;;
    u) USERNAME="$OPTARG" ;;
    *) echo "$HELP" >&2; exit 1 ;;
  esac
done

# Check required flags
if [ -z "$DIRECTORY" ] || [ -z "$NAMESPACE" ] || [ -z "$PASSWORD" ] || [ -z "$USERNAME" ]; then
  echo "$HELP" >&2
  exit 1
fi

# Find the MinIO pod
POD_NAME=$(kubectl get pods -n $NAMESPACE -l $LABEL -o jsonpath="{.items[0].metadata.name}")

if [ -z "$POD_NAME" ]; then
  echo "MinIO pod not found in namespace $NAMESPACE with label $LABEL"
  exit 1
fi

echo "Found MinIO pod: $POD_NAME"

# Start port-forward in background
kubectl port-forward -n $NAMESPACE $POD_NAME $PORT:9000 > /dev/null 2>&1 &
PF_PID=$!

# Wait a few seconds for port-forward to establish
sleep 5

# Configure MinIO client
mc alias set $MC_ALIAS http://localhost:$PORT $USERNAME $PASSWORD

# Create root backup directory
mkdir -p "$DIRECTORY"

# List all buckets
BUCKETS=$(mc ls $MC_ALIAS | awk '{print $5}')

if [ -z "$BUCKETS" ]; then
  echo "No buckets found on MinIO instance."
  kill $PF_PID
  exit 1
fi

# Loop through buckets and mirror each
for BUCKET in $BUCKETS; do
  BUCKET_DIR="$DIRECTORY/$BUCKET"
  mkdir -p "$BUCKET_DIR"
  echo "Backing up bucket: $BUCKET"
  mc mirror --overwrite $MC_ALIAS/$BUCKET "$BUCKET_DIR"
done

echo "All buckets backed up to $DIRECTORY"

# Stop port-forward
kill $PF_PID
echo "Port-forward stopped."
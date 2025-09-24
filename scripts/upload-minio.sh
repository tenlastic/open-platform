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

# Check backup directory exists
if [ ! -d "$DIRECTORY" ]; then
  echo "Backup directory $DIRECTORY does not exist."
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

# Loop through backup directories and restore each bucket
for BUCKET_DIR in "$DIRECTORY"/*; do
  if [ -d "$BUCKET_DIR" ]; then
    BUCKET_NAME=$(basename "$BUCKET_DIR")
    echo "Restoring bucket: $BUCKET_NAME"

    # Create bucket if it doesn't exist
    if ! mc ls $MC_ALIAS/$BUCKET_NAME > /dev/null 2>&1; then
        mc mb $MC_ALIAS/$BUCKET_NAME
    fi

    # Mirror backup contents to MinIO bucket
    mc mirror --overwrite "$BUCKET_DIR" $MC_ALIAS/$BUCKET_NAME
  fi
done

echo "All buckets restored from $DIRECTORY"

# Stop port-forward
kill $PF_PID
echo "Port-forward stopped."

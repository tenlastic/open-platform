#!/bin/bash

# Configuration
HELP="Usage: $0 -d directory -n namespace -p password -u username"
LABEL="app.kubernetes.io/name=minio"
MC_ALIAS="minio"
PORT="443"

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

# Configure MinIO client
mc alias set $MC_ALIAS https://minio.tenlastic.com:$PORT $USERNAME $PASSWORD

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
    mc mirror --max-workers 1 --overwrite "$BUCKET_DIR" $MC_ALIAS/$BUCKET_NAME
  fi
done

echo "All buckets restored from $DIRECTORY"

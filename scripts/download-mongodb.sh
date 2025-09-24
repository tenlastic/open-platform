#!/bin/bash

# Configuration
HELP="Usage: $0 -d directory -n namespace -p password -u username"
LABEL="app.kubernetes.io/name=mongodb"
PORT="27017"

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

# Find the MongoDB pod
POD_NAME=$(kubectl get pods -n $NAMESPACE -l $LABEL -o jsonpath="{.items[0].metadata.name}")

if [ -z "$POD_NAME" ]; then
  echo "MongoDB pod not found in namespace $NAMESPACE with label $LABEL"
  exit 1
fi

echo "Found MongoDB pod: $POD_NAME"

# Start port-forward in background
kubectl port-forward -n $NAMESPACE $POD_NAME $PORT:27017 > /dev/null 2>&1 &
PF_PID=$!

# Wait a few seconds for port-forward to establish
sleep 5

# Create backup directory
mkdir -p "$DIRECTORY"

# Run mongodump
echo "Starting MongoDB backup..."
mongodump \
  --authenticationDatabase admin \
  --host localhost \
  --out "$DIRECTORY" \
  --password "$PASSWORD" \
  --port "$PORT" \
  --username "$USERNAME"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully! Saved to $DIRECTORY"
else
  echo "Backup failed!"
fi

# Stop port-forward
kill $PF_PID
echo "Port-forward stopped."

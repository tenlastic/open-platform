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

# Check backup directory exists
if [ ! -d "$DIRECTORY" ]; then
  echo "Backup directory $DIRECTORY does not exist."
  exit 1
fi

# Find the MongoDB pod
POD_NAME=$(kubectl get pods -n $NAMESPACE -l $LABEL -o jsonpath="{.items[0].metadata.name}")

if [ -z "$POD_NAME" ]; then
  echo "MongoDB pod not found in namespace $NAMESPACE with label $LABEL"
  exit 1
fi

echo "Found MongoDB pod: $POD_NAME"

# Start port-forward
kubectl port-forward -n $NAMESPACE $POD_NAME $PORT:27017 > /dev/null 2>&1 &
PF_PID=$!

sleep 5

# Run mongorestore
echo "Starting MongoDB restore..."
mongorestore \
  --authenticationDatabase admin \
  --drop \
  --host localhost \
  --password "password" \
  --port $PORT \
  --username "root" \
  "$DIRECTORY"

if [ $? -eq 0 ]; then
  echo "Restore completed successfully!"
else
  echo "Restore failed!"
fi

# Stop port-forward
kill $PF_PID
echo "Port-forward stopped."
#!/usr/bin/env bash
set -e

# Get the current project from GCloud.
PROJECT=$(gcloud config list --format 'value(core.project)')

# Find the Google APIs service account email address.
SERVICE_ACCOUNT=$(
  gcloud projects get-iam-policy "${PROJECT}" \
    | grep -m 1 -o '[0-9]*@cloudservices.gserviceaccount.com'
)

# Grant the Owner role to the Google APIs service account.
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member "serviceAccount:${SERVICE_ACCOUNT}" \
  --role "roles/owner"

# Remove default Editor role from Google APIs service account.
gcloud projects remove-iam-policy-binding "${PROJECT}" \
  --member "serviceAccount:${SERVICE_ACCOUNT}" \
  --role "roles/editor"

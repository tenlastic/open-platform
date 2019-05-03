#!/usr/bin/env bash
set -e

GCP_PROJECT="staging-238505"

gcloud iam service-accounts create dns-admin \
  --display-name=dns-admin \
  --project=${GCP_PROJECT}

gcloud iam service-accounts keys create ./gcp-dns-admin.json \
  --iam-account=dns-admin@${GCP_PROJECT}.iam.gserviceaccount.com \
  --project=${GCP_PROJECT}

gcloud projects add-iam-policy-binding ${GCP_PROJECT} \
  --member=serviceAccount:dns-admin@${GCP_PROJECT}.iam.gserviceaccount.com \
  --role=roles/dns.admin

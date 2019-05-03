#!/usr/bin/env bash
set -e

DIRNAME=$(dirname "${0}")
PROJECT=$(gcloud config list --format 'value(core.project)')

gcloud iam service-accounts keys create "${DIRNAME}/../service-accounts/${1}.json" \
  --iam-account "${1}@${PROJECT}.iam.gserviceaccount.com"

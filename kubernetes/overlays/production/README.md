```
export PROJECT="production-303220"

# Download Service Account credentials for CertManager.
gcloud iam service-accounts keys create "../../gcp/service-accounts/dns-admin.json" \
  --iam-account "dns-admin@${PROJECT}.iam.gserviceaccount.com"

#
```

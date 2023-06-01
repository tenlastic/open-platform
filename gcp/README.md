## Getting Started

#### Deploy Infrastructure

```bash
export PROJECT="production-303220"

# Log in to GCloud CLI.
gcloud auth login
gcloud config set project "${PROJECT}"

# Enable required services.
gcloud services enable cloudbilling.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable deploymentmanager.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable iam.googleapis.com

# Get the default Service Account's email address.
export SERVICE_ACCOUNT=$(
  gcloud projects get-iam-policy "${PROJECT}" \
    | grep -m 1 -o '[0-9]*@cloudservices.gserviceaccount.com'
)

# Grant the Owner role to the default Service Account.
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member "serviceAccount:${SERVICE_ACCOUNT}" \
  --role "roles/owner"

# Remove default Editor role from default Service Account.
gcloud projects remove-iam-policy-binding "${PROJECT}" \
  --member "serviceAccount:${SERVICE_ACCOUNT}" \
  --role "roles/editor"

# Deploy service account and storage bucket for Terraform.
gcloud deployment-manager deployments create "terraform" \
  --template "./deployment-manager/terraform.jinja"

# Download Service Account credentials for Terraform.
gcloud iam service-accounts keys create "./service-accounts/terraform.json" \
  --iam-account "terraform@${PROJECT}.iam.gserviceaccount.com"

# Deploy Terraform resources.
export GOOGLE_CREDENTIALS=$(cat ./service-accounts/terraform.json)
cd ./terraform/
terraform init
terraform apply -auto-approve
cd ../

# Connect to cluster.
gcloud container clusters get-credentials primary \
  --zone "us-east4-a"
```

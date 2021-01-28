## Getting Started

#### Deploy Infrastructure

```bash
# Start a Gcloud Docker container.
docker-compose run gcloud

# Log in to GCloud CLI.
gcloud auth login
gcloud config set project [PROJECT]

# Enable required services.
gcloud services enable cloudbilling.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable deploymentmanager.googleapis.com
gcloud services enable iam.googleapis.com

# Grant the Google APIs service account with the Owner role.
./scripts/google-apis-service-account.sh

# Deploy service account and storage bucket for Terraform.
gcloud deployment-manager deployments create "terraform-resources" \
  --template "./deployment-manager/terraform-resources.jinja"

# Create service account for Terraform.
./scripts/get-service-account-key.sh terraform
```

```bash
# Start a Terraform Docker container.
docker-compose run terraform

# Load Google credentials for Terraform.
export GOOGLE_CREDENTIALS=$(cat ./service-accounts/terraform.json)

# Deploy IAM profiles.
cd ./terraform/custom-roles/
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
cd ../../../

# Deploy Kubernetes cluster.
cd ./terraform/cluster/
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
cd ../../../
```

```bash
# Connect to cluster.
gcloud container clusters get-credentials primary \
  --zone "us-central1-a"
```

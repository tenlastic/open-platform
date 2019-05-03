terraform {
  backend "gcs" {
    bucket = "primary-terraform-state"
    credentials = "../../service-accounts/terraform.json"
    prefix = "primary"
  }
}

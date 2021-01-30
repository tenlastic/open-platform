terraform {
  backend "gcs" {
    bucket = "production-303220-terraform"
    prefix = "cluster"
  }
}

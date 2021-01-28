resource "google_storage_bucket" "velero" {
  force_destroy = true
  location      = var.region
  name          = "primary-velero-backup"
}

module "velero" {
  source = "../modules/service-account"

  display_name = "Velero Service Account"
  name         = "velero"
  project      = var.project
  role         = "projects/${var.project}/roles/velero"
}

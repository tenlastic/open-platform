resource "google_storage_bucket" "velero" {
  force_destroy = true
  location      = var.region
  name          = "${var.project}-velero"
}

resource "google_project_iam_custom_role" "velero" {
  description = "Grants Velero Server the permissions required to create backups."
  role_id     = "velero"
  title       = "Velero Service Account"

  permissions = [
    "compute.disks.create",
    "compute.disks.createSnapshot",
    "compute.disks.get",
    "compute.snapshots.create",
    "compute.snapshots.delete",
    "compute.snapshots.get",
    "compute.snapshots.useReadOnly",
    "compute.zones.get",
    "storage.objects.create",
    "storage.objects.get",
    "storage.objects.list",
  ]
}

module "velero" {
  source = "./modules/service-account"

  display_name = "Velero Service Account"
  name         = "velero"
  project      = var.project
  role         = "projects/${var.project}/roles/${google_project_iam_custom_role.velero.role_id}"
}

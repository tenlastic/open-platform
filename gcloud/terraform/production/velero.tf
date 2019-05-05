resource "google_storage_bucket" "velero" {
  location = "${var.region}"
  name     = "velero"
}

resource "google_project_iam_custom_role" "velero" {
  description = "Grants Velero Server the permissions required to create backups."
  role_id = "velero.server"
  title   = "Velero Server"

  permissions = [
    "compute.disks.create",
    "compute.disks.createSnapshot",
    "compute.disks.get",
    "compute.snapshots.create",
    "compute.snapshots.delete",
    "compute.snapshots.get",
    "compute.snapshots.useReadOnly",
    "compute.zones.get"
  ]
}

module "velero" {
  source = "../modules/service-account"

  display_name = "Velero Service Account"
  name         = "velero"
  project      = "${var.project}"
  role         = "roles/velero.server"
}

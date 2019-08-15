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

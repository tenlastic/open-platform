resource "google_service_account" "iam" {
  account_id   = var.name
  display_name = var.display_name
}

resource "google_project_iam_binding" "iam" {
  members = ["serviceAccount:${var.name}@${var.project}.iam.gserviceaccount.com"]
  project = var.project
  role    = var.role
}

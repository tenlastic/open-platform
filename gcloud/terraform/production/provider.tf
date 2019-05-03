provider "google" {
  credentials = "../../service-accounts/terraform.json"
  project     = "${var.project}"
  region      = "${var.region}"
  zone        = "${var.zone}"
}

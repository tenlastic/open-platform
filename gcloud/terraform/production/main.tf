provider "google" {
  credentials = "../../service-accounts/terraform.json"
  project     = "${var.project}"
}

resource "google_container_cluster" "primary" {
  initial_node_count       = 1
  location                 = "${var.location}"
  min_master_version       = "1.12.7-gke.7"
  name                     = "primary"
  node_version             = "1.12.7-gke.7"
  remove_default_node_pool = true

  addons_config {
    horizontal_pod_autoscaling {
      disabled = true
    }

    http_load_balancing {
      disabled = true
    }

    kubernetes_dashboard {
      disabled = true
    }

    network_policy_config {
      disabled = false
    }
  }

  ip_allocation_policy {
    use_ip_aliases = true
  }
}

module "default_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  location       = "${var.location}"
  max_node_count = 3
  min_node_count = 1
}

module "preemptible_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  location       = "${var.location}"
  machine_type   = "g1-small"
  max_node_count = 5
  min_node_count = 3
  name           = "preemptible-pool"
  preemptible    = true
}

resource "google_compute_address" "istio" {
  name = "istio"
}

resource "google_dns_managed_zone" "tenlastic" {
  description = "Tenlastic Managed Zone"
  dns_name    = "tenlastic.com."
  name        = "tenlastic"
}

resource "google_dns_record_set" "production" {
  managed_zone = "${google_dns_managed_zone.tenlastic.name}"
  name         = "*.${google_dns_managed_zone.tenlastic.dns_name}"
  rrdatas      = ["${google_compute_address.istio.address}"]
  ttl          = 300
  type         = "A"
}

resource "google_dns_record_set" "staging" {
  managed_zone = "${google_dns_managed_zone.tenlastic.name}"
  name         = "*.staging.${google_dns_managed_zone.tenlastic.dns_name}"
  rrdatas      = ["${google_compute_address.istio.address}"]
  ttl          = 300
  type         = "A"
}

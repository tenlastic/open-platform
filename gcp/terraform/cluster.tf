resource "google_container_cluster" "primary" {
  initial_node_count       = 1
  location                 = var.zone
  min_master_version       = "1.19.6-gke.1700"
  name                     = "primary"
  remove_default_node_pool = true

  addons_config {
    network_policy_config {
      disabled = false
    }
  }

  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "10.0.0.0/14"
    services_ipv4_cidr_block = "10.4.0.0/20"
  }

  network_policy {
    enabled = true
    provider = "CALICO"
  }

  release_channel {
    channel = "RAPID"
  }
}

module "default_pool" {
  source = "./modules/node-pool"

  cluster_name   = google_container_cluster.primary.name
  machine_type   = "n2d-standard-2"
  max_node_count = 3
  min_node_count = 1

  labels = {
    "tenlastic.com/high-priority" = "true"
  }
}

module "preemptible_pool" {
  source = "./modules/node-pool"

  cluster_name   = google_container_cluster.primary.name
  machine_type   = "e2-standard-2"
  max_node_count = 7
  min_node_count = 0
  name           = "preemptible-pool"
  preemptible    = true

  labels = {
    "tenlastic.com/low-priority" = "true"
  }
}

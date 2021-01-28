resource "google_container_cluster" "primary" {
  initial_node_count       = 1
  location                 = "${var.zone}"
  min_master_version       = "1.17.14-gke.400"
  name                     = "primary"
  remove_default_node_pool = true

  addons_config {
    network_policy_config {
      disabled = false
    }
  }

  ip_allocation_policy {
    use_ip_aliases = true
  }

  network_policy {
    enabled = true
    provider = "CALICO"
  }
}

module "default_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  machine_type   = "n1-standard-2"
  max_node_count = 3
  min_node_count = 1

  labels = {
    "tenlastic.com/high-priority" = "true"
  }
}

module "preemptible_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  machine_type   = "n1-standard-2"
  max_node_count = 7
  min_node_count = 1
  name           = "preemptible-pool"
  preemptible    = true

  labels = {
    "tenlastic.com/low-priority" = "true"
  }
}

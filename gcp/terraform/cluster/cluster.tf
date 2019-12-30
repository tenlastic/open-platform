resource "google_container_cluster" "primary" {
  initial_node_count       = 1
  location                 = "${var.zone}"
  min_master_version       = "1.14.8-gke.17"
  name                     = "primary"
  node_version             = "1.14.8-gke.17"
  remove_default_node_pool = true

  ip_allocation_policy {
    use_ip_aliases = true
  }
}

module "default_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  machine_type   = "n1-standard-1"
  max_node_count = 3
  min_node_count = 1
}

module "preemptible_pool" {
  source = "../modules/node-pool"

  cluster_name   = "${google_container_cluster.primary.name}"
  machine_type   = "n1-standard-2"
  max_node_count = 7
  min_node_count = 1
  name           = "preemptible-pool"
  preemptible    = true
}

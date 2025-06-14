resource "google_container_cluster" "primary" {
  enable_shielded_nodes    = false
  initial_node_count       = 1
  location                 = var.zone
  name                     = "primary"
  remove_default_node_pool = true

  addons_config {
    dns_cache_config {
      enabled = false
    }
    
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
    channel = "REGULAR"
  }
}

module "high_priority_pool" {
  source = "./modules/node-pool"

  cluster_name   = google_container_cluster.primary.name
  disk_size_gb   = 50
  machine_type   = "n2d-standard-4"
  max_node_count = 3
  min_node_count = 0
  name           = "high-priority-pool"

  labels = {
    "tenlastic.com/high-priority" = "true"
  }
}

module "low_priority_pool" {
  source = "./modules/node-pool"

  cluster_name   = google_container_cluster.primary.name
  disk_size_gb   = 50
  machine_type   = "n2d-standard-4"
  max_node_count = 10
  min_node_count = 0
  name           = "low-priority-pool"
  spot           = true

  labels = {
    "tenlastic.com/low-priority" = "true"
  }
}

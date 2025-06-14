resource "google_container_node_pool" "node_pool" {
  cluster            = var.cluster_name
  location           = var.location
  name               = var.name

  autoscaling {
    max_node_count = var.max_node_count
    min_node_count = var.min_node_count
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    disk_size_gb = var.disk_size_gb
    labels = var.labels
    machine_type = var.machine_type
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    spot  = var.spot

    metadata = {
      "disable-legacy-endpoints" = "true"
    }
  }
}

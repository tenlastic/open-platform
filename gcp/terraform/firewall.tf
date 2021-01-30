resource "google_compute_firewall" "node_ports" {
  name    = "node-ports"
  network = "default"
  source_ranges = ["0.0.0.0/0"]

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["30000-32767"]
  }

  allow {
    protocol = "udp"
    ports    = ["30000-32767"]
  }
}
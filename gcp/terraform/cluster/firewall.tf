resource "google_compute_firewall" "node-ports" {
  name    = "node-ports"
  network = "default"
  source_ranges = ["0.0.0.0/0"]

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["60000-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["60000-65535"]
  }
}
output "load_balancer_ip_address" {
  value = google_compute_address.load_balancer.address
}

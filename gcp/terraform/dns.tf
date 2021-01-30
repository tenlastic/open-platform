resource "google_compute_address" "load_balancer" {
  name = "load-balancer"
}

resource "google_dns_managed_zone" "tenlastic_com" {
  description = "Tenlastic Managed Zone"
  dns_name    = "tenlastic.com."
  name        = "tenlastic"
}

resource "google_dns_record_set" "wildcard_tenlastic_com" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = "*.${google_dns_managed_zone.tenlastic_com.dns_name}"
  rrdatas      = [google_compute_address.load_balancer.address]
  ttl          = 300
  type         = "A"
}

module "dns_admin" {
  source = "./modules/service-account"

  display_name = "DNS Service Account"
  name = "dns-admin"
  project = var.project
  role = "roles/dns.admin"
}

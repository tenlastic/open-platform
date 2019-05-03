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

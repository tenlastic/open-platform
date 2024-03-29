resource "google_compute_address" "load_balancer" {
  name = "load-balancer"
}

resource "google_dns_managed_zone" "tenlastic_com" {
  description = "Tenlastic Managed Zone"
  dns_name    = "tenlastic.com."
  name        = "tenlastic"
}

resource "google_dns_record_set" "tenlastic_com" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = google_dns_managed_zone.tenlastic_com.dns_name
  rrdatas      = [google_compute_address.load_balancer.address]
  ttl          = 300
  type         = "A"
}

resource "google_dns_record_set" "wildcard_tenlastic_com" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = "*.${google_dns_managed_zone.tenlastic_com.dns_name}"
  rrdatas      = [google_compute_address.load_balancer.address]
  ttl          = 300
  type         = "A"
}

resource "google_dns_record_set" "gmail" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = google_dns_managed_zone.tenlastic_com.dns_name
  ttl          = 3600
  type         = "MX"

  rrdatas = [
    "1 aspmx.l.google.com.",
    "5 alt1.aspmx.l.google.com.",
    "5 alt2.aspmx.l.google.com.",
    "10 alt3.aspmx.l.google.com.",
    "10 alt4.aspmx.l.google.com."
  ]
}

resource "google_dns_record_set" "mailgun" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = "support.${google_dns_managed_zone.tenlastic_com.dns_name}"
  rrdatas      = ["10 mxa.mailgun.org.","10 mxb.mailgun.org."]
  ttl          = 3600
  type         = "MX"
}

resource "google_dns_record_set" "mailgun_spf" {
  managed_zone = google_dns_managed_zone.tenlastic_com.name
  name         = "support.${google_dns_managed_zone.tenlastic_com.dns_name}"
  rrdatas      = ["\"v=spf1 include:mailgun.org ~all\""]
  ttl          = 3600
  type         = "TXT"
}

module "dns_admin" {
  source = "./modules/service-account"

  display_name = "DNS Service Account"
  name = "dns-admin"
  project = var.project
  role = "roles/dns.admin"
}

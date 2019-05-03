module "dns_admin" {
  source = "../modules/service-account"

  display_name = "DNS Service Account"
  name = "dns-admin"
  project = "${var.project}"
  role = "roles/dns.admin"
}

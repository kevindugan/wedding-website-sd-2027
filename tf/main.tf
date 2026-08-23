
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.45.0"
    }
  }
}

variable "project_id" {
  type = string
}

variable "project_region" {
  type    = string
  default = "us-central1"
}

provider "google" {
  project = var.project_id
  region  = var.project_region
}

resource "google_project_service" "compute" {
  project                    = var.project_id
  service                    = "compute.googleapis.com"
  disable_dependent_services = true
}

resource "random_id" "bucket_prefix" {
  byte_length = 8
}

resource "google_storage_bucket" "static_website" {
  name          = "${random_id.bucket_prefix.hex}-new-bucket"
  location      = "US"
  storage_class = "COLDLINE"

  uniform_bucket_level_access = true
  force_destroy = true

  website {
    main_page_suffix = "index.html"
  }
}

# Make bucket public by granting allUsers storage.objectViewer access
resource "google_storage_bucket_iam_member" "public_rule" {
  bucket = google_storage_bucket.static_website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_compute_backend_bucket" "lb_backend_bucket" {
  name        = "static-backend-bucket"
  bucket_name = google_storage_bucket.static_website.name
  enable_cdn  = true # Recommended to reduce egress latency and costs
}

resource "google_compute_global_address" "default" {
  name       = "lb-static-ip"
  ip_version = "IPV4"
}

resource "google_compute_managed_ssl_certificate" "default" {
  name = "lb-managed-cert"

  managed {
    domains = ["sandiegowedding.gigispot.net"]
  }
}

resource "google_compute_health_check" "default" {
  name               = "lb-health-check"
  check_interval_sec = 5
  timeout_sec        = 5

  http_health_check {
    port = 80
  }
}

resource "google_compute_url_map" "default" {
  name            = "lb-url-map"
  default_service = google_compute_backend_bucket.lb_backend_bucket.id
}

resource "google_compute_target_https_proxy" "default" {
  name             = "lb-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "default" {
  name                  = "lb-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = google_compute_global_address.default.id
}

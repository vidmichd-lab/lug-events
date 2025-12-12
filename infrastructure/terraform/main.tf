terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  token     = var.yandex_token
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = "ru-central1-a"
}

# PostgreSQL Database
resource "yandex_mdb_postgresql_cluster" "events_db" {
  name        = "events-db"
  environment = "PRODUCTION"
  network_id  = yandex_vpc_network.events_network.id

  config {
    version = 15
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-ssd"
      disk_size          = 20
    }
  }

  database {
    name  = "events_db"
    owner = "events_user"
  }

  user {
    name     = "events_user"
    password = var.db_password
  }

  host {
    zone      = "ru-central1-a"
    subnet_id = yandex_vpc_subnet.events_subnet.id
  }
}

# VPC Network
resource "yandex_vpc_network" "events_network" {
  name = "events-network"
}

resource "yandex_vpc_subnet" "events_subnet" {
  name           = "events-subnet"
  zone           = "ru-central1-a"
  network_id     = yandex_vpc_network.events_network.id
  v4_cidr_blocks = ["10.1.0.0/24"]
}

# Container Registry
resource "yandex_container_registry" "events_registry" {
  name = "events-registry"
}

# Service Account for containers
resource "yandex_iam_service_account" "events_sa" {
  name        = "events-sa"
  description = "Service account for events application"
}

# Grant permissions
resource "yandex_resourcemanager_folder_iam_member" "events_sa_editor" {
  folder_id = var.folder_id
  role      = "editor"
  member    = "serviceAccount:${yandex_iam_service_account.events_sa.id}"
}

# Outputs
output "database_host" {
  value = yandex_mdb_postgresql_cluster.events_db.host[0].fqdn
}

output "registry_id" {
  value = yandex_container_registry.events_registry.id
}


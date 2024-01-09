# The Tenlastic Open Platform

## Prerequisites

- **Windows Only**: [Install Windows Subsystem for Linux.](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

## Getting Started

Start a Development container with the following command:

```
# Run container as root.
GROUP_ID="0" USER_ID="0" docker-compose run development-cli

# Run container as current user.
GROUP_ID="$(id -g)" USER_ID="$(id -u)" docker-compose run development-cli
```

- [Deploy resources to Google Cloud Platform with Deployment Manager and Terraform.](./gcp/README.md)
- [Deploy Kubernetes resources using Kustomize.](./kustomize/README.md)
- [Start Dockerized NodeJS applications locally.](./nodejs/README.md)
- [Start Dockerized Angular applications locally.](./angular/README.md)

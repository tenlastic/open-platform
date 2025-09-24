FROM ubuntu:22.04

ENV ARGO_VERSION 2.7.0
ENV DOCKER_VERSION 18.06.3-ce
ENV FLUX_VERSION 1.16.0
ENV HELM_2_VERSION v2.16.0
ENV HELM_3_VERSION v3.3.1
ENV KUBECONFIG /.kube/config
ENV KUBESEAL_VERSION v0.9.5
ENV MKCERT_VERSION 1.4.4
ENV STERN_VERSION 1.22.0
ENV TERRAFORM_VERSION 0.14.5

USER root
WORKDIR /usr/src/

# Run package update and install some basics.
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -qy apt-transport-https ca-certificates curl gnupg2 libnss3-tools software-properties-common python2-dev unzip wget

# Install docker.
RUN curl -L -o /tmp/docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz && \
  tar -xz -C /tmp -f /tmp/docker.tgz && \
  mv /tmp/docker/* /usr/bin

# Install gcloud.
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
  apt-get update && apt-get install -qy google-cloud-sdk
RUN apt-get install -qy google-cloud-sdk-gke-gcloud-auth-plugin

# Install git and git-lfs.
RUN apt-get install -qy git git-lfs

# Install kubectl.
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
  install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install kustomize.
RUN curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash && \
  mv kustomize /bin/kustomize

# Install MongoDB Database Tools.
RUN apt-get update && apt-get install -y wget gnupg && \
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add - && \
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
  apt-get update && apt-get install -y mongodb-database-tools && \
  rm -rf /var/lib/apt/lists/*

# Install node and npm.
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
  apt-get install -qy nodejs

# Install terraform
RUN curl -o terraform.zip https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
  unzip terraform.zip && \
  chmod +x terraform && \
  mv terraform /usr/local/bin/terraform && \
  rm terraform.zip

# Install argo.
RUN wget https://github.com/argoproj/argo-workflows/releases/download/v$ARGO_VERSION/argo-linux-amd64 -O argo && \
  chmod +x argo && \
  mv argo /usr/local/bin/argo

# Install fluxctl.
RUN wget -O fluxctl https://github.com/fluxcd/flux/releases/download/${FLUX_VERSION}/fluxctl_linux_amd64 && \
  chmod +x fluxctl && \
  mv fluxctl /usr/local/bin/fluxctl

# Install helm 2.
RUN wget -O helm-${HELM_2_VERSION}-linux-amd64.tgz https://get.helm.sh/helm-${HELM_2_VERSION}-linux-amd64.tar.gz && \
  tar -zxvf helm-${HELM_2_VERSION}-linux-amd64.tgz && \
  mv linux-amd64/helm /usr/local/bin/helm-2 && \
  rm helm-${HELM_2_VERSION}-linux-amd64.tgz && \
  rm -rf linux-amd64

# Install helm 3.
RUN wget -O helm-${HELM_3_VERSION}-linux-amd64.tgz https://get.helm.sh/helm-${HELM_3_VERSION}-linux-amd64.tar.gz && \
  tar -zxvf helm-${HELM_3_VERSION}-linux-amd64.tgz && \
  mv linux-amd64/helm /usr/local/bin/helm && \
  rm helm-${HELM_3_VERSION}-linux-amd64.tgz && \
  rm -rf linux-amd64

# Install jq.
RUN curl -o /usr/local/bin/jq http://stedolan.github.io/jq/download/linux64/jq && \
  chmod +x /usr/local/bin/jq

# Install mc (minio client).
RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc -O mc && \
  chmod +x mc && \
  mv mc /usr/local/bin/mc

# Install mkcert.
RUN wget https://github.com/FiloSottile/mkcert/releases/download/v${MKCERT_VERSION}/mkcert-v${MKCERT_VERSION}-linux-amd64 -O mkcert && \
  chmod +x mkcert && \
  mv mkcert /usr/local/bin/mkcert

# Install stern.
RUN wget https://github.com/stern/stern/releases/download/v${STERN_VERSION}/stern_${STERN_VERSION}_linux_arm64.tar.gz -O stern.tar.gz && \
  tar -zxvf stern.tar.gz stern && \
  chmod +x stern && \
  mv stern /usr/local/bin/stern && \
  rm stern.tar.gz

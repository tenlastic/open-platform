FROM ubuntu:18.04

ENV FLUX_VERSION 1.16.0
ENV HELM_VERSION v2.16.0
ENV KUBECONFIG /.kube/config
ENV KUBESEAL_VERSION v0.9.5
ENV TERRAFORM_VERSION 0.11.13

USER root
WORKDIR /home/

# Run package update and install some basics.
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg2 \
  software-properties-common \
  python-dev \
  unzip \
  wget

# Install gcloud.
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
  apt-get update && apt-get install -y google-cloud-sdk

# Install terraform
RUN curl -o terraform.zip https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
  ls -alh && \
  unzip terraform.zip && \
  chmod +x terraform && \
  mv terraform /usr/local/bin/terraform && \
  rm terraform.zip

# Install kubectl.
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list  && \
  apt-get update  && \
  apt-get install -y kubectl && \
  ln -s /usr/bin/kubectl /usr/local/bin/kubectl

# Install helm.
RUN curl -o helm-$HELM_VERSION-linux-amd64.tgz https://storage.googleapis.com/kubernetes-helm/helm-$HELM_VERSION-linux-amd64.tar.gz && \
  tar -zxvf helm-$HELM_VERSION-linux-amd64.tgz && \
  mv linux-amd64/helm /usr/local/bin/helm && \
  rm helm-$HELM_VERSION-linux-amd64.tgz && \
  rm -rf linux-amd64

# Install jq to parse JSON within bash scripts.
RUN curl -o /usr/local/bin/jq http://stedolan.github.io/jq/download/linux64/jq && \
  chmod +x /usr/local/bin/jq

# Install fluxctl.
RUN wget -O fluxctl https://github.com/fluxcd/flux/releases/download/$FLUX_VERSION/fluxctl_linux_amd64 && \
  chmod +x fluxctl && \
  mv fluxctl /usr/local/bin/fluxctl

# Install kubeseal.
RUN wget https://github.com/bitnami-labs/sealed-secrets/releases/download/$KUBESEAL_VERSION/kubeseal-linux-amd64 -O kubeseal && \
  chmod +x kubeseal && \
  mv kubeseal /usr/local/bin/kubeseal

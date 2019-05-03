---
title: "Myelin installation steps (GCP)"
date: 2019-05-01T13:00:00+06:00
author: Tamas Jambor
---

This post describes how to install *Myelin* on Google Cloud Platform.
<br><br>

<!--more-->

1. Create namespace:

    ```bash
    NAMESPACE=myelin
    kubectl create ns $NAMESPACE
    kubectl label namespace $NAMESPACE istio-injection=enabled
    ```

2. Install Helm client: [Installation](https://github.com/helm/helm/blob/master/docs/install.md)

3. Install Tiller:

    ```bash
    kubectl -n kube-system create sa tiller
    kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
    helm init --service-account tiller
    ```

4. Add *Myelin* repo to Helm:

    ```bash
    helm repo add myelin.io https://myelin-helm-charts.storage.googleapis.com/
    helm repo update
    ```

5. Setup authentication:

    Create a file `secrets.yaml` with the following content:

    ```yaml
    authenticateDocker:
      enabled: true

    dockerSecret:
      auths:
        dockerRegistryUrl:
          auth: authbase64
          Username: username
          Password: password
          Email: email

    artifacts:
      accesskey: accesskey
      secretkey: secretkey

    authenticateGithub:
      enabled: true

    github:
      sshPrivateKey: PRIVATE_KEY
      sshPublicKey: PUBLIC_KEY
    ```


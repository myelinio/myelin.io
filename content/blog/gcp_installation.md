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

    artifacts:
      accesskey: accesskey
      secretkey: secretkey

    authenticateGithub:
      enabled: true

    github:
      sshPrivateKey: PRIVATE_KEY
      sshPublicKey: PUBLIC_KEY
    ```

    - **dockerRegistryUrl:** add the repository url instead of this line, for example use `https://gcr.io`
    for Google Container Registry.
    - **dockerSecret.auths.auth:** Auth token. To obtain this token for GCP, go to IAM -> [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
    and create a new key. Then convert this file to a base64 encode string: `echo -n '_json_key:' | cat - key.json | base64`

    Enable s3 interoperability for Google Storage [here.](https://console.cloud.google.com/storage/settings) Select
    the interoperability tab and create a new key, which can be used for the following:

    - **artifacts.accesskey:** gcp access key
    - **artifacts.secretkey:** gcp secret key

    To access Github using SSH add the following (set authenticateGithub.enabled to false if you are accessing public repositories
     via https):

    - **github.sshPrivateKey:** private key
    - **github.sshPublicKey:** public key

    Create a config file `gcp-config.yaml`:

    Create a bucket that stores temporary files on Google Storage. Make sure the region is the same as the bucket region.

    ```yaml
    rook-ceph:
      agent:
        flexVolumeDirPath: /home/kubernetes/flexvolume

    workflowController:
      dockerServer: dockerRegistryUrl
      dockerNamespace: namespace
      config:
        artifactRepository:
          archiveLogs: true
          s3:
            bucket: myelin-dev
            endpoint: storage.googleapis.com
            region: eu-west-1
            accessKeySecret:
              name: myelin-artifacts
              key: accesskey
            secretKeySecret:
              name: myelin-artifacts
              key: secretkey

    deployerController:
      config:
        artifactRepository:
          archiveLogs: true
          s3:
            bucket: myelin-dev
            endpoint: storage.googleapis.com
            region: eu-west-1
            accessKeySecret:
              name: myelin-artifacts
              key: accesskey
            secretKeySecret:
              name: myelin-artifacts
              key: secretkey
    ```
    The following values should be filled in:

    - **workflowController.dockerServer:** repository url, use `gcr.io` for Container Registry. This repository is used to store docker images created by Myelin.
    - **workflowController.dockerNamespace:** namespace of the repository, for GCR it is the same as the project name.

6. Install the Helm chart:

    - Install *Myelin* (add the --devel flag if you would like to install the latest development version)

        ```bash
        RELEASE_NAME=myelin-app
        CONFIG_FILE=gcp-config.yaml
        SECRETS_FILE=secrets.yaml
        NAMESPACE=myelin

        helm install myelin.io/myelin \
             --debug \
             --name $RELEASE_NAME \
             -f $CONFIG_FILE,$SECRETS_FILE \
             --set createCustomResource=true \
             --set deployerController.createCustomResource=true \
             --namespace=$NAMESPACE
        ```
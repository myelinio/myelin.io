---
title: "Myelin installation steps (AWS)"
date: 2019-02-19T16:51:12+06:00
author: Tamas Jambor
image: images/blog/aws_logo_smile_1200x630.png
---

This post describes how to install *Myelin* on AWS.

<!--more-->

1. Create namespace:

    ```bash
    NAMESPACE=myelin
    kubectl create ns $NAMESPACE
    kubectl label namespace $NAMESPACE istio-injection=enabled
    ```

2. Install helm: https://github.com/helm/helm/blob/master/docs/install.md

3. Install tiller:

    ```bash
    kubectl -n kube-system create sa tiller
    kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
    helm init --service-account tiller
    ```

4. Add myelin repo to Helm:

    ```bash
    helm repo add myelin.io https://myelin-helm-charts.storage.googleapis.com/
    helm repo update
    ```

5. Setup authentication:
    
    Create a file `secrets.yaml` with the following content:

    ```yaml
    dockerSecret:
      auths:
        registry.hub.docker.com:
          auth: authbase64
          Username: username
          Password: password
          Email: email
    
    artifacts:
      accesskey: accesskey
      secretkey: secretkey
    
    github:
      sshPrivateKey: PRIVATE_KEY
      sshPublicKey: PUBLIC_KEY
    ```

    In this file the following fields should be provided:
    
    - authbase64: `echo -n 'username:password' | base64`
    - username: dockerhub user name
    - password: dockerhub password
    - email: dockerhub email
    - accesskey: aws access key
    - secretkey: aws secret key
    
    Create a config file `aws-config.yaml`:
    
    Make sure the region is the same as the cluster region
    
    ```yaml
    workflowController:
      dockerServer: registry.hub.docker.com
      dockerNamespace: docker-images
      config:
        artifactRepository:
          archiveLogs: true
          s3:
            bucket: myelin-dev
            endpoint: s3.eu-central-1.amazonaws.com
            region: eu-central-1
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
            endpoint: s3.eu-central-1.amazonaws.com
            region: eu-central-1
            accessKeySecret:
              name: myelin-artifacts
              key: accesskey
            secretKeySecret:
              name: myelin-artifacts
              key: secretkey
    ```

6. Install the Helm chart:

    - Get the latest version:

        ```bash
        helm search myelin.io -l
        VERSION=v0.1.7-20190304000414
        ```

    - Install Myelin

        ```bash
        RELEASE_NAME=myelin-app
        CONFIG_FILE=aws-config.yaml
        SECRETS_FILE=secrets.yaml
        NAMESPACE=myelin
        VERSION=v0.1.7-20190304000414
        
        helm install myelin.io/myelin \
             --debug \
            --version $VERSION \
             --name $RELEASE_NAME \
             -f $CONFIG_FILE,$SECRETS_FILE \
             --set createCustomResource=true \
             --set deployerController.createCustomResource=true \
             --namespace=$NAMESPACE
        ```
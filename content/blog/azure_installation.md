---
title: "Myelin installation steps (Azure)"
date: 2019-04-25T08:51:12+06:00
author: Ryadh Khsib
---

This post describes how to install *Myelin* on Azure.
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
        myelinregistry.azurecr.io:
          auth: authbase64=
          Username: username@gmail.com
          Password: password
          Email: username@gmail.com
    
    artifacts:
      accesskey: accesskey
      secretkey: secretkey
    
    authenticateGithub:
      enabled: true
    
    github:
      sshPrivateKey: SSH_PRIVATE_KEY
      sshPublicKey: SSH_PUBLIC_KEY
    ```

    In this file the following fields should be provided:
    
    - **dockerRegistryUrl:** add the repository url instead of this line, for example use `registry.hub.docker.com` for docker hub.
    - **dockerSecret.auths.auth:** Auth token. For docker hub it can be generated as follows: `echo -n 'username:password' | base64`
    - **dockerSecret.auths.Username:** docker repository user name
    - **dockerSecret.auths.Password:** docker repository password
    - **dockerSecret.auths.Email:** docker repository email
   
    <br/>
    Get or create an Azure Storage account and retrieve the key:
    
     ```bash
    az storage account create --resource-group myResourceGroup --name myelinstorage --sku Standard_LRS
    az storage account keys list  --resource-group myResourceGroup --account-name myelinstorage
    ```
    - **artifacts.accesskey:** Azure access key
    - **artifacts.secretkey:** Azure secret key
    
    <br/>
    To access Github using SSH add the following:
    
    - **github.sshPrivateKey:** private key
    - **github.sshPublicKey:** public key
    
    <br/>
    Create a config file `Azure-config.yaml`:
        
    ```yaml
     rook-ceph:
       agent:
         flexVolumeDirPath: /etc/kubernetes/volumeplugins
     
     minio:
       enabled: true
       persistence:
         enabled: false
       azuregateway:
         enabled: true
         replicas: 1
       fullnameOverride: myelin-minio-svc
       defaultBucket:
         enabled: true
         name: myelin-bucket
       accessKey: myelinstorage
       secretKey: myelinstorage_key
     
     workflowController:
       dockerServer: myelinregistry.azurecr.io
       dockerNamespace: myelinproj
       config:
         artifactRepository:
           archiveLogs: true
           s3:
             bucket: myelin-bucket
             endpoint: myelin-minio-svc.myelin:9000
             insecure: true
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
             bucket: myelin-bucket
             endpoint: myelin-minio-svc.myelin:9000
             insecure: true
             accessKeySecret:
               name: myelin-artifacts
               key: accesskey
             secretKeySecret:
               name: myelin-artifacts
               key: secretkey
    ```
    
    The following values should be filled in:
    
    - **workflowController.dockerServer:** repository url, for example use `registry.hub.docker.com` for docker hub.
    - **workflowController.dockerNamespace:** namespace of the repository, for docker hub it is the same as the user name.

6. Install the Helm chart:

    - Install *Myelin* (add the --devel flag if you would like to install the latest development version)

        ```bash
        RELEASE_NAME=myelin-app
        CONFIG_FILE=Azure-config.yaml
        SECRETS_FILE=secrets.yaml
        NAMESPACE=myelin
        
        helm install myelin.io/myelin \
             --debug \
             --wait --timeout 600 \
             --devel \
             --name $RELEASE_NAME \
             -f $CONFIG_FILE,$SECRETS_FILE \
             --set createCustomResource=true \
             --set deployerController.createCustomResource=true \
             --namespace=$NAMESPACE
        ```

7. Install the *Myelin* cli:

    ```bash
    brew tap myelin/cli https://github.com/myelinio/homebrew-cli.git
    brew install myelin
    ```        

8. Test first Axon:
    - Create Axon:
    
        ```bash
        myelin submit https://raw.githubusercontent.com/myelinio/myelin-examples/master/recommender_rf_demo/recommender-demo.yaml --namespace=$NAMESPACE
        ```
    - Watch Axon execution:
    
        ```bash
        myelin watch axon ml-rec-rf --namespace=$NAMESPACE
        ```
    - Get Axon public endpoints:
    
        ```bash
        REST_URL=$(myelin endpoint ml-rec-rf  --namespace=$NAMESPACE|grep fixedUrl| cut -d" " -f2)
        curl -XPOST ${REST_URL}predict --data '{"data":{"ndarray":[5411, 5439]}}'
        ```
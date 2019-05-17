---
title: "Myelin installation steps (AWS)"
date: 2019-02-19T16:51:12+06:00
author: Tamas Jambor
image: images/blog/aws_logo_smile_1200x630.png
---

This post describes how to install *Myelin* on AWS.
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

    In this file the following fields should be provided:
    
    - **dockerRegistryUrl:** add the repository url instead of this line, for example use `registry.hub.docker.com` for docker hub.
    - **dockerSecret.auths.auth:** Auth token. For docker hub it can be generated as follows: `echo -n 'username:password' | base64`
    - **dockerSecret.auths.Username:** docker repository user name
    - **dockerSecret.auths.Password:** docker repository password
    - **dockerSecret.auths.Email:** docker repository email

    <br/>
    Get your AWS access and secret keys: [AWS key setup](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html).
    Note that the user associated with this key should have sufficient privileges to read and write to S3.
     
    - **artifacts.accesskey:** aws access key
    - **artifacts.secretkey:** aws secret key

    <br/>
    To access Github using SSH add the following (set authenticateGithub.enabled to false if you are accessing public repositories
     via https):
    
    - **github.sshPrivateKey:** private key
    - **github.sshPublicKey:** public key

    <br/>
    Create a config file `aws-config.yaml`:

    ```yaml
    axonController:
      dockerServer: dockerRegistryUrl
      dockerNamespace: namespace
      config:
        artifactRepository:
          archiveLogs: true
          s3:
            bucket: myelin-dev
            endpoint: s3.eu-west-1.amazonaws.com
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
            endpoint: s3.eu-west-1.amazonaws.com
            region: eu-west-1
            accessKeySecret:
              name: myelin-artifacts
              key: accesskey
            secretKeySecret:
              name: myelin-artifacts
              key: secretkey
    ```
    
    The following values should be filled in:
    
    - **workflowController.dockerServer:** repository url, for example use `registry.hub.docker.com` for docker hub. This repository is used to store docker images created by Myelin.
    - **workflowController.dockerNamespace:** namespace of the repository, for docker hub it is the same as the user name.
    - **workflowController.config.artifactRepository.s3.bucket:** S3 bucket
    - **workflowController.config.artifactRepository.s3.endpoint:** S3 endpoint. See Amazon Simple Storage Service (Amazon S3) in [AWS endpoints](https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region)
    - **workflowController.config.artifactRepository.s3.region:** S3 region.
    - **deployerController.config.artifactRepository.s3.bucket:** S3 bucket
    - **deployerController.config.artifactRepository.s3.endpoint:** S3 endpoint. See Amazon Simple Storage Service (Amazon S3) in [AWS endpoints](https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region)
    - **deployerController.config.artifactRepository.s3.region:** S3 region.

    Create an S3 bucket that stores temporary files on S3. Make sure the region is the same as the bucket region.

6. Install the Helm chart:

    - Install *Myelin* (add the --devel flag if you would like to install the latest development version)

        ```bash
        RELEASE_NAME=myelin-app
        CONFIG_FILE=aws-config.yaml
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
    - Get Axon public REST endpoints:

        ```bash
        REST_URL=$(myelin endpoint ml-rec-rf  --namespace=$NAMESPACE -o json | jq -r '.fixedUrl')
        curl -XPOST ${REST_URL}predict --data '{"data":{"ndarray":[5411, 5439]}}'
        ```
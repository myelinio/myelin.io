---
title: "GCP Marketplace Prerequisites"
date: 2019-09-20T13:00:00+06:00
author: Tamas Jambor
---

This article lists the prerequisites that should be in place before deploying
Myelin on GCP marketplace.

1. Create a GKE cluster with Istio enabled:

    ```bash
    gcloud beta container clusters create test-cluster --preemptible \
        --addons=Istio --istio-config=auth=MTLS_PERMISSIVE \
        --machine-type=n1-standard-4 --num-nodes=1 --disk-size=30 --issue-client-certificate \
        --enable-basic-auth --zone=europe-west2-c \
        --image-type=UBUNTU
    ```

2. Create a namespace:

    ```bash
    kubectl create ns myelin-ns
    kubectl label namespace myelin-ns istio-injection=enabled
    ```
    
3. Create two bucket for Myelin to save logs into.

    ```bash
    gsutil mb -l europe-west2 gs://myelin-axon/ 
    gsutil mb -l europe-west2 gs://myelin-deployer/
    ```
 
    
4. Create the necessary customer resource definitions:

    ```bash
    kubectl apply -f "https://raw.githubusercontent.com/GoogleCloudPlatform/marketplace-k8s-app-tools/master/crd/app-crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/coreos/prometheus-operator/v0.30.1/example/prometheus-operator-crd/alertmanager.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/coreos/prometheus-operator/v0.30.1/example/prometheus-operator-crd/prometheus.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/coreos/prometheus-operator/v0.30.1/example/prometheus-operator-crd/prometheusrule.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/coreos/prometheus-operator/v0.30.1/example/prometheus-operator-crd/servicemonitor.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/crd/myelin.axon.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/crd/myelin.deployer.crd.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/crd/myelin.workflow.crd.yaml"
    ```
5. Create the following cluster roles. These roles define a set of permissions that are
required for Myelin controllers and additional components installed by default
(Prometheus and NFS provisioner).

    ```bash
    kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/deployer/role/axon-controller-role.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/deployer/role/prometheus-operator-role.yaml"
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/deployer/role/nfs-provisioner-role.yaml"
	```
	
6. Create a storage class. Myelin uses NFS filesystem to store metadata and
models. A network disk gets attached to each instance to share data between pods and
steps (we also support alternatives such as Ceph or HDFS).

    ```bash
	kubectl apply -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/deployer/role/nfs-provisioner-storageclass.yaml"
    ```
    
7. Create a service account for the Myelin. This service account 
is used when Myelin executes its axons. The name of this service account (myelin-minimal)
should be referred in the axon definition in `spec.serviceAccountName`:

    ```bash
    kubectl apply -n myelin-ns -f "https://raw.githubusercontent.com/myelinio/myelin-gcp-marketplace/master/myelin/deployer/role/myelin-minimal-role.yaml"
    ```
    
After the initial setup, deploy the application from the marketplace: [GCP Marketplace](https://console.cloud.google.com/marketplace/details/myelin-public/myelin)
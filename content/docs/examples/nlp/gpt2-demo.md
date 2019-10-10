---
title: "GPT2"
date: 2019-01-19T14:51:12+06:00
author: Ryadh Khsib
image: images/blog/movie-recommendationv2.jpg
---

This blog post fine tunes a GPT2 model on Shakespeare data
and explains how to deploy it with *Myelin*.

<!--more-->

### TL;DR

- Install Myelin cli

    MacOS installation:

    ```bash
    brew tap myelin/cli https://github.com/myelinio/homebrew-cli.git
    brew install myelin
    ```

    Linux installation:

    ```bash
    curl -sSL -o /usr/local/bin/myelin https://myelin-cli.storage.googleapis.com/cli-linux/v0.4.0/myelin-linux-amd64
    chmod +x /usr/local/bin/myelin
    # Add bash completion
    apt-get install bash-completion
    myelin completion bash > /etc/bash_completion.d/myelin
    ```

- Create a new namespace
    ```bash
    NAMESPACE=myelin
    kubectl create ns $NAMESPACE
    ```

- Create a service account
    ```bash
    kubectl create -n $NAMESPACE -f https://raw.githubusercontent.com/myelinio/myelin-examples/master/myelin-sa.yaml
    ```

- Create the deployment, wait until it gets deployed:
    ```bash
    myelin submit https://raw.githubusercontent.com/myelinio/myelin-examples/master/gpt2_demo/gpt2_demo.yaml -n $NAMESPACE --watch
    ```
    
- Get generated Shakespeare
    
    ```bash
    NAMESPACE=myelin

    #Get the proxy name (if only one model is deployed)
    URL=$(myelin endpoint -n $NAMESPACE ml-gpt2 -o json | jq -r '.fixedUrl')
    PROXY_URL=${URL}predict

    DATA='{"data": {"ndarray": ["To be, or not to be: that is the question"]}}'
    curl -v -d "${DATA}" "${PROXY_URL}"
    ```
    
    This returns the generated text.

Full code can be found [here.](https://github.com/myelinio/myelin-examples/tree/master/gpt2_demo)

### Basic structure

The deployment contains three steps (we call these tasks):

- **Pre-processing step:** download the pretrained model and the Shakespeare data, uncompress and put it in a shared folder
- **Training step:** Train the GPT2 model
- **Deployment step:** Deploy a REST API to serve the model

In addition Myelin provides sensors that make decisions on how to proceed between tasks.
We will define three sensors:

- **Train on start:** a sensor that executes tasks for the first time
- **Deployment decision maker:** a sensor that makes a decision whether the train model
can be deployed
- **Post deployment decision maker:** a sensor that monitors the deployed model
and decides to retrain it when the performance drops

### Artifacts

Artifacts contain the code that is used throughout the the deployment. This
gets attached to the container during built steps.

It is defined as follows:
```
artifacts:
- name: rec-source
  path: /src
  git:
    repo: git@github.com:myelinio/myelin-examples.git
    revision: master
    sshPrivateKeySecret:
      name: github-creds
      key: ssh-private-key
```

- **path**: defines the path where the code gets exposed during build steps
- **git**: type of artifacts, we also support other artifacts such as *s3*
- **git.repo**: name of the repository
- **git.revision**: which branch or tag the process should pull
- **git.sshPrivateKeySecret**: credentials, if you are planning to use
 a private repository. Access key and secret can be provided in Helm,
 when installing Myelin.

### Volume

Volume is a shared folder that is attached to each container that can be used
to share data between steps. This folder is normally exposed by some environment
variables (by default: `MODEL_PATH` and `DATA_PATH`)

In this example we define an `nfs` shared disk:
```
volumeClaimTemplate:
metadata:
  name: axon-store
spec:
  storageClassName: nfs
  accessModes: ["ReadWriteMany"]
  resources:
    requests:
      storage: 1Gi
```

Alternatively we provide a flag in helm that can enable `ceph` instead of `nfs`.
If Myelin was install with `ceph` use the following definition instead:
```
volume:
name: axon-store
flexVolume:
  driver: ceph.rook.io/rook
  fsType: ceph
  options:
    fsName: myfs # name of the filesystem specified in the filesystem CRD.
    clusterNamespace: myelin # namespace where the Rook cluster is deployed
```


### Start the process (sensor)

To kick off the process we need to define a sensor that executes the first task:
```
- name: TrainOnStart
  tasks:
    - resourceExecutor:
        task: DataPrepGPT2
    - trainer:
        task: TrainGPT2
```
This defines the workflow that contains two tasks (data prep and training)
that gets executed in the same order they are defined.

### Preprocessing (task)

The first compute step is the preprocessing step, this downloads the pretrained model and 
data to the shared folder and puts it in a format the training steps needs.
This taks needs a set of packages that the code will be using.


*requirements.preprocess.txt* contains some basic Python packages:
```
requests
tqdm
```

*preprocess.py* downloads the model and the data and save it to the shared folder in a format
the training process expects it.

We need an image that has the necessary tools to run this code.
This is defined in *Dockerfile.preprocess*:
```
FROM python:3.6-slim

COPY requirements.preprocess.txt requirements.txt
RUN pip install -r  requirements.txt

WORKDIR /work

COPY ./preprocess.py /work/preprocess.py

CMD python preprocess.py
```

This executes *preprocess.py* and saves the data in the shared folder.

In the Myelin deployment definition, only have to define the following task:
```yaml
- name: DataPrepGPT2
  container:
    imageBuild:
      repositoryName: preprocess-myelin-gpt2
      artifact: gpt2-source
      buildLocation: /src/gpt2_demo
      dockerfile:
        path: Dockerfile.preprocess
```

This task contains the definition of the image and its corresponding repository.

### Training (task)

In the training step, the process will pick up the data saved by the previous step,
loads it in memory, trains the model and saves the model in the same shared folder.

The first step is to define the Docker images to build the container for the
training step. It is defined in *Dockerfile.train*:
```
FROM python:3.6

RUN pip3 install --upgrade pip

RUN apt-get update && apt-get install -y libopenblas-dev

COPY requirements.train.txt requirements.txt
RUN pip install -r  requirements.txt

WORKDIR /work

RUN mkdir /work/gpt2/

COPY src /work/gpt2_demo/src
COPY train.py /work/gpt2_demo/train.py

CMD python -m gpt2_demo.train
```

This executes *gpt2_demo.train* package and saves the model in the shared folder.

Followed by the task definition:
```yaml
- name: TrainGPT2
  train:
    imageBuild:
      repositoryName: train-myelin-gpt2
      artifact: gpt2-source
      buildLocation: /src/gpt2_demo
      dockerfile:
        path: Dockerfile.train
```

As before this task build the image and executes it afterward.

### Deployment decision maker (sensor)
This sensor monitors the training task and gets executed when training
is complete. It is responsible deploying an endpoint that exposes the model
to the outside world.

```
- name: DeploymentDecisionMaker
  triggers:
    - name: trainComplete
      type: Lifecycle
      condition: Succeeded
      task: TrainGPT2

  tasks:
    - deployer:
        name: deployer1
        rolloutSpec:
          - destinations:
              - destinationIndex: 0
                weight: 100
        models:
          - name: MyelinGPT2
            modelSelectionStrategy: "best"
            routingStrategy:
              - destinations:
                  - destinationName: shakespearegp2
                    weight: 100
            backendModels:
              - name: shakespearegp2
                trainer: TrainGPT2
                deployer: DeployGPT2
                modelSelectionStrategy: "best"
        routes:
          - path: /predict
            dag:
              - model: MyelinGPT2
                path: /predict
          - path: /send-feedback
            dag:
              - model: MyelinGPT2
                path: /send-feedback

```

This component allows users to define routing strategies between multiple
(retrained) versions of the model, also between different variations of
models.

---
title: "Myelin Movie Recommender Demo"
date: 2019-01-19T14:51:12+06:00
author: Tamas Jambor
image: images/blog/movie-recommendationv2.jpg
---

This blog post builds a simple movie recommender demo
and explains how to deploy it with *Myelin*.

<!--more-->

### TL;DR

- Install Myelin cli (MacOS)
    ```bash
    brew tap myelin/cli https://github.com/myelinio/homebrew-cli.git
    brew install myelin
    ```

- Create a new namespace
    ```bash
    NAMESPACE=myelin
    kubectl create ns $NAMESPACE
    ```

- Create a service account
    ```bash
    kubectl create sa -n $NAMESPACE -f https://raw.githubusercontent.com/myelinio/myelin-examples/master/recommender_demo/myelin-sa.yaml
    ```

- Create the deployment, wait until it gets deployed:
    ```bash
    myelin submit https://raw.githubusercontent.com/myelinio/myelin-examples/master/recommender_demo/recommender-demo.yaml -n $NAMESPACE --watch
    ```
    
- Get recommendation
    
    ```bash
    NAMESPACE=myelin

    #Get the proxy name (if only one model is deployed)
    URL=$(myelin endpoint -n $NAMESPACE ml-rec -o json | jq -r '.fixedUrl')
    PROXY_URL=${URL}predict

    DATA='{"data": {"ndarray": [3, 4]}}'
    curl -v -d "${DATA}" "${PROXY_URL}"
    ```
    
    This returns a rating for user 10, item 3 and user 10, item 4.

Full code can be found [here.](https://github.com/myelinio/myelin-examples/tree/master/recommender_demo)

### Basic structure

The deployment contains three steps (we call these tasks):

- **Pre-processing step:** download the Movielens data, uncompress and put it in a shared folder
- **Training step:** Train a Keras recommender model
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

In this example we define a `ceph` shared disk:
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
        task: DataPrepMyelinRecommender
    - trainer:
        task: TrainMyelinRecommender
```
This defines the workflow that contains two tasks (data prep and training)
that gets executed in the same order they are defined.

### Preprocessing (task)

The first compute step is the preprocessing step, this downloads the Movielens
data to the shared folder and puts it in a format the training steps needs.
This taks needs a set of packages that the code will be using.
In this case this is shared between the preprocessing and training steps, but it is possible to have
different set of requirements used in each step.

*requirements.txt* contains some basic Python packages:
```
numpy==1.16.0rc1
h5py==2.8.0
scipy>= 0.13.3
scikit-learn>=0.18
pandas>=0.22.0
keras==1.2.2
six>=1.11.0
tensorflow==1.5.0
Theano==1.0.4
myelin==0.0.10
```

*preprocess.py* downloads the data and save it to the shared folder in a format
the training process expects it.

We need an image that has the necessary tools to run this code.
This is defined in *Dockerfile.preprocess*:
```
FROM python:3.6

RUN pip3 install --upgrade pip

COPY requirements.txt requirements.txt
RUN pip install -r  requirements.txt

WORKDIR /work
COPY ./preprocess.py /work/preprocess.py
CMD python preprocess.py
```

This executes *preprocess.py* and saves the data in the shared folder.

In the Myelin deployment definition, only have to define the following task:
```yaml
- name: DataPrepMyelinRecommender
  container:
    imageBuild:
      repositoryName: preprocess-myelin-recommender
      artifact: rec-source
      buildLocation: /src/recommender_demo
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

COPY requirements.txt requirements.txt
RUN pip install -r  requirements.txt

WORKDIR /work
RUN mkdir /work/myelin_recommender/

COPY myelin_model /work/myelin_recommender/myelin_model
COPY train.py /work/myelin_recommender/train.py

CMD python -m myelin_recommender.train
```

This executes *myelin_recommender.train* package and saves the model in the shared folder.

Followed by the task definition:
```yaml
- name: TrainMyelinRecommender
  train:
    imageBuild:
      repositoryName: train-myelin-recommender
      artifact: rec-source
      buildLocation: /src/recommender_demo
      dockerfile:
        path: Dockerfile.train
```

As before this task build the image and executes it afterward.

### Deployment decision maker (sensor)

After the two tasks are completed, we define a sensor that decides whether
the trained model is worth deploying:
```
- name: DeploymentDecisionMaker
  triggers:
    - name: mnistTrainingComplete
      type: Lifecycle
      condition: Succeeded
      task: TrainMyelinRecommender
  conditions:
    - name: mnistTrainAccuracy
      type: Metric
      condition: "{{mnist_train_accuracy}} > 0.95"
      task: TrainMnistSklearn
  tasks:
    - deployer:
        models:
          - trainer: TrainMyelinRecommender
            deployer: DeployMyelinRecommender
            modelSelectionStrategy: best
```

This sensor has two main components `triggers` and `conditions`.

**Triggers** define under what circumstances this sensor should be evaluated.
In this case it gets evaluated when `TrainMyelinRecommender` succeeds.
**Conditions** query the metric generated by the training step in order to
define a set of condition that are required to progress to the next step.
**Tasks** set what are the next steps to run after these condition are met.

### Deployment (task)

After the model is trained and the condition to deploy is met, Myelin will
run the deployment step. This step is slightly different from the previous
ones since the deployment needs to be exposed through an API:

```
- name: DeployMyelinRecommender
  deploy:
    deploymentType: "canary"
    replicas: 2
    endpointType: REST
    endpointRestType: Multipart
    imageBuild:
      repositoryName: deploy-myelin-recommender
      artifact: rec-source
      buildLocation: /src/
      s2i:
        contextDir: recommender_demo
        buiderImage: docker.io/myelinio/myelin-deployer-s2i-python:v0.1.1
```

In this case we don't need to define a *Dockerfile* as Myelin provides a
builder image that exposes the code through an API using an S2I builder.

For S2I, we need to define the following:
- *.s2i/environment* the environment variables used in the container
- *RNNRecommender.py* has the code to load and define the predict method

### Post deployment decision maker (sensor)

This sensor monitors the deployment and makes a decision to execute tasks
(for example retrain) if a list of conditions are met:
```
- name: DeploymentDecisionMaker
  triggers:
    - name: mnistTrainingComplete
      type: Lifecycle
      condition: Succeeded
      task: TrainMyelinRecommender

  tasks:
    - deployer:
        models:
          - name: MyelinKerasRecommender
            trainer: TrainMyelinTest
            deployer: DeployMyelinTest
            modelSelectionStrategy: "best"
        routes:
          - path: /predict
            dag:
              - task: DeployMyelinRecommender
                path: /predict
          - path: /send-feedback
            dag:
              - task: DeployMyelinRecommender
                path: /send-feedback

```

In this definition the sensor would retrain the model (run data preprocessing
and training) if accuracy drops below 0.9. Once this condition is true
it runs the two tasks to redeploy the model.
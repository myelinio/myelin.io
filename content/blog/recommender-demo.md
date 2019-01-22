---
title: "Myelin Movie Recommender Demo"
date: 2019-01-19T14:51:12+06:00
author: Tamas Jambor
image: images/blog/movie-recommendation.jpg
---

This blog post builds a simple movie recommender demo,
and explains how to deploy it with *Myelin*.

The deployment contains three steps (we called these tasks):

- **Pre-processing step:** download the Movielens data, uncompress and put it in a shared folder
- Training step: Train a Keras recommender model
- Deployment step: Deploy a REST API to serve the model


In addition Myelin provides sensors that makes decisions on how to proceed between tasks.
We will define three sensors:

- Train on start: a sensor that executes tasks for the first time
- Deployment decision maker: a sensor that makes a decision whether the train model
can be deployed
- Post deployment decision maker: a sensor that monitors the deployed model
and decides to retrain it when the performance drops

### Preprocessing step:

The first step is to define all the packages the code will be using.
In this case this is shared between all three steps, but it is possible to have
different set of packages used for each step.

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
myelin==0.0.6
```


*preprocess.py* downloads the data and save it to the shared folder in a format
the training process expects it. Full code can be founds [here.](https://raw.githubusercontent.com/myelinio/myelin-examples/master/recommender_demo/preprocess.py)

We need an image that has the necessary tools for this step.
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
  type: Generic
  image: mye-docker-repository/myelinproj/preprocess-myelin-recommender

  imageBuild:
    type: Docker
    repositoryName: preprocess-myelin-recommender
    buildLocation: /src/myelin_recommender
    dockerfile: Dockerfile.preprocess
```

This task contains the definition of the image and its corresponding repository.

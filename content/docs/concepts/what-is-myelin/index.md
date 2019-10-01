---
title: What is Myelin?
description: Introduces Myelin, the problems it solves, its high-level architecture and design goals.
weight: 15
aliases:
    - /docs/concepts/what-is-myelin/overview
    - /docs/concepts/what-is-myelin/goals
    - /about/intro
---

Myelin is a [Cloud Native](https://www.cncf.io/) Machine Learning deployment framework.

Myelin was inspired by the philosophy of [Kubernetes](https://kubernetes.io), where the user describes the desired state of a machine learning deployment and Myelin works out the best way to achieve that state.

In a simple case, the desired state might include a single model that is 
trained and deployed, serving accurate predictions. When the model performance drops, 
Myelin retrains the model and replaces the inaccurate one.

Myelin aims at helping Data Science teams deliver digital services. 

Our framework was built around core infrastructure principles:

- **Infrastructure as Code** 
- **Mutability** 
- **Reproducibility** 
- **Observability** 
- **Horizontal Scalability** 
- **Security** 


And around Data Science aims:

- **AutoML**
- **AutoAdaptive ML**

## Event Driven Job Scheduling Framework

Myelin offer set of configurable sensors that lister to configured event and triggers a pipeline once an event is fired.
Event sensors type could be external (REST trigger, Prometheus alert) or internal (Calendar, another Task execution lifecyle event,..)

The framework provides additional features:

- **Persistent Volumes Provisioning** 
- **Artifacts Loading** from remote Git repositories.
- **Docker Images Building**: using custom `Dockerfile` or using custom builder, e.g [S2I](https://github.com/openshift/source-to-image)
- **Task DAG Execution**: Task scheduling and execution.


## ML Models Training

### Training Runtime
Myelin provides tools to run ML models on top of Kubernetes. It also allows to configure the provisioned infrastructure and resources . 

### Hyper-parameter Optimisation
Myelin models can be tuned using Hyper-parameter optimisation (HPO). The HPO controller implements state-of-the-art algorithms to search for optimal models hyper-parameters.

Implemented optimisers include [Hyperband](https://arxiv.org/abs/1603.06560) and [BOHB](https://www.automl.org/blog_bohb/):

- **Hyperband**:  Divides the total budget into several combinations of number of configurations vs. budget for each, to then call successive halving as a subroutine on each set of random configurations.

- **BOHB**: Bayesian Optimization and Hyperband, combines Hyperband with Bayesian Optimisation.

## ML Models Deployment
### Model Runtime Deployment
The framework allows to automatically generate REST API and Docker image using user prediction source code.

### Model Graph Deployment
Myelin provides easy ways to deploy a predictive graph of models. Once a model is trained, a sensor can be configured to automatically deploy the trained model.

A model graph is collection of models that contribute to build a higher level prediction. For example, an OCR model could be implemented as` 


### Automated Model Versioning
Each deployed model is versioned and is assigned a URL for specific to the version. The version is generated using the unique set of events that triggered the deployment task.

### Model Selection Strategy
If multiple models are selected to perform a prediction, Myelin provides tools to automatically select the best model based on reported performance metrics.


## ML Models Automatic Correction
### Metrics Server
Myelin Metrics infrastructure is built around [Prometheus](https://prometheus.io). Helper client libraries are provided to help exporting metrics.

### Alerts Processing
Each model can define alerts based on metrics. Myelin can be then configured to react to alerts and trigger repair actions.
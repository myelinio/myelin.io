FROM ubuntu:latest as STAGEONE

# install hugo
ENV HUGO_VERSION=0.53
ADD https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz /tmp/
RUN tar -xf /tmp/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz -C /usr/local/bin/

# install syntax highlighting
RUN apt-get update
RUN apt-get install -y python3-pygments

# build site
COPY ./ /source
RUN hugo --source=/source/ --destination=/public/

FROM nginx:stable-alpine
COPY --from=STAGEONE /public/ /usr/share/nginx/html/
EXPOSE 80
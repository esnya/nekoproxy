FROM node
MAINTAINER ukatama dev.ukatama@gmail.com

ADD reverse-proxy reverse-proxy
RUN cd reverse-proxy && npm install

ENTRYPOINT cd reverse-proxy && node .

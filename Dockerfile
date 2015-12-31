FROM node
MAINTAINER ukatama dev.ukatama@gmail.com

ADD proxy proxy
RUN cd proxy && npm install

ENTRYPOINT cd proxy && node .

FROM node
MAINTAINER ukatama dev.ukatama@gmail.com

ADD proxy proxy
ADD package.json package.json
ADD config config
RUN npm install

ENTRYPOINT node .

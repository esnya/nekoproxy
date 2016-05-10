# Nekoproxy
[![Build Status](https://img.shields.io/travis/ukatama/nekoproxy/master.svg?style=flat-square)](https://travis-ci.org/ukatama/nekoproxy)
[![Coverage Status](https://img.shields.io/coveralls/ukatama/nekoproxy.svg?style=flat-square)](https://coveralls.io/github/ukatama/nekoproxy)
[![PeerDependencies](https://img.shields.io/david/peer/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy#info=peerDependencies&view=list)
[![Dependencies](https://img.shields.io/david/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy)
[![DevDependencies](https://img.shields.io/david/dev/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy#info=devDependencies&view=list)

NekoRPG front-end reverse proxy with SNS-SSO.

```
                            +---------+
                            | Twitter |
                            +-------- +
                                 ^
                                 |
                                auth
                                 |
                                 |
+---------+                +-----------+                           +------+ 
| Browser | -- request --> | Nekoproxy |  -- get routes/addr -->   | etcd |
+---------+                +-----------+                           +------+
                                 |                                    ^
                                 |                                    |
                               proxy                                addr
                                 |                                    |
                                 v                                    |
                           +-------------+                   +------------------+
                           | Application | <-- watch addr -- | nekoetcd-connect |
                           +-------------+                   +------------------+
```

## Requirements
- Docker
- etcd v2
- SQL Database
  - See also: [Knex.js](http://knexjs.org/)

## Configuration
Config file is `/usr/src/app/config/local.yml`.

ToDo (See also: `config/default.yml`, `config/production.yml`)

## Usage

ToDo

## Draft documentation (Japanese)
https://gist.github.com/ukatama/027555494619fb2a202ff7bc52611c3f

# Nekoproxy
[![Build Status](https://img.shields.io/travis/ukatama/nekoproxy/master.svg?style=flat-square)](https://travis-ci.org/ukatama/nekoproxy)
[![Coverage Status](https://img.shields.io/coveralls/ukatama/nekoproxy.svg?style=flat-square)](https://coveralls.io/github/ukatama/nekoproxy)
[![PeerDependencies](https://img.shields.io/david/peer/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy#info=peerDependencies&view=list)
[![Dependencies](https://img.shields.io/david/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy)
[![DevDependencies](https://img.shields.io/david/dev/ukatama/nekoproxy.svg?style=flat-square)](https://david-dm.org/ukatama/nekoproxy#info=devDependencies&view=list)

NekoRPG front-end reverse proxy.

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

## Features
- HTTP(S) reverse proxy
  - Domain and URL based routing
- Live-Configuration by etcd
  - Update router configurations without rebooting
- Signle sign on (SSO) with external providers
  - Twitter OAuth
- Dynamic docker container linkage with etcd
  - Kind of ambassador pattern
- Cross-Origin Resource Sharing (CORS)

## Requirements
- Docker
- etcd v2
- SQL Database
  - See also: [Knex.js](http://knexjs.org/)

## Run
```
$ docker run -d --name redis redis
$ docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=<PASSWORD> mysql
$ docker run -d --name etcd quay.io/coreos/etcd  \
    --listen-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001 \
    --advertise-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001
$ docker run -d --name nekoproxy \
    -p 80:80 -p 443:443 \
    --link redis:redis --link mysql:mysql --link etcd:etcd \
    -v /path/to/config.json/usr/src/app/local.json:ro \
    -v /path/to/cert.pem:/etc/certs/cert.pem:ro \
    -v /path/to/privkey.pem:/etc/certs/privkey.pem:ro \
    --env NODE_ENV=production
    nekorpg/nekoproxy
```

If you want to use Live-Configuration, see also routes -> Live-Configuration.

## Connect
Connect the application which will be proxy destination.

```bash
$ docker run -d --name nekochat <...options> ukatama/nekochat # Target application
$ docker run -d --name nekochat-connect \
    --link etcd:etct \
    --link nekochat:nekochat \
    --env APP=nekochat \
    ukatama/nekoetcd-connect
```

## Architecture
```
                                              +-----------------+
                                              | OAuthProvider-A |
                                              +-----------------+
                                                      ^
                                                      |
                                                     Auth
                                                      |
                 +---------+                      +-------+
HTTP Resutst  -> | tcp/80  | -+               +-> | App-A | -+           +--------------+
                 +---------+  |   +--------+  |   +-------+  |           | HTTP Servers |-+
                              +-> | Router | -+              +- Proxy -> +--------------+ |-+
                 +---------+  |   +--------+  |   +-------+  |             +--------------+ |
HTTPS Resutst -> | tcp/443 | -+       |       +-> | App-B | -+               +--------------+
                 +---------+          v           +-------+ 
                                  Watch etcd          |
                                                     Auth
                                                      |
                                                      v
                                              +-----------------+
                                              | OAuthProvider-B |
                                              +-----------------+
```

## Configuration
Configuration file is `/usr/src/app/config/local.yml`.
Default values are specified in [`config/default.yml`](https://github.com/ukatama/nekoproxy/blob/master/config/default.yml) and [`config/production.yml`](https://github.com/ukatama/nekoproxy/blob/master/config/production.yml)


| key       | type            | description                                    |
|-----------|-----------------|------------------------------------------------|
| apps      | object          | Application configurations (See below)         |
| etcd.host | string          | etcd host address                              |
| etcd.port | number          | etcd port                                      |
| routes    | array or "etcd" | Route configurations (See below)               |
| metrics   | object          | Pormetheus endpoint configuration (deprecated) |
| ssl.cert  | string          | Path to cert file                              |
| ssl.key   | string          | Path to private key file                       |

### apps
Specify applications by object which has key of application ID.
Application has individual session and OAuth provider configurations.

Unify the following values in all of the proxy destination applications.
  - `database`
  - `session.cookie.domain`
  - `session.secret`

| key                   | type    | description                                                         |
|-----------------------|---------|---------------------------------------------------------------------|
| (key)                 | string  | Application ID                                                      |
| name                  | string  | Full name of application                                            |
| domain                | string  | Domain name                                                         |
| database              | object  | SQL database configuration (Knex.js)                                |
| passport              | object  | Authentication provider configurations (passport.js)                |
| passport.twitter      | object  | Twitter OAuth configuration                                         |
| redis                 | object  | Redis configuration (node-redis)                                    |
| signUp                | boolean | Enable/Disable sign up. `false` to forbid new users.                |
| session               | object  | Session configuration (express-session)                             |
| session.cookie.domain | string  | Domain of cookie. Sould be same as the value of `domain`            |
| session.store         | string  | `"redis"` or `"knex"` (SQL Database which configured by `database`) |
| session.secret        | string  | Secret value of session.                                            |
| sslRedirect           | boolean | Set `true` to force redirect HTTP to HTTPS                          |

### routes
Specify proxy routes by array in descending order of priority.

Each of route is specified in an object consisting of the following keys:

| key      | type            | description                                                                                   |
|----------|-----------------|-----------------------------------------------------------------------------------------------|
| host     | string          | Host name matcher                                                                             |
| url      | string (regexp) | URL matcher. optional. e.g. `"^/foo/bar[0-9]+$"`                                              |
| methods  | array of string | Arrowed methods                                                                               |
| app      | string          | Application ID                                                                                |
| target   | string          | Set target address without etcd. e.g. `http://127.0.0.1:8080`                                 |
| etcd     | string          | Key of the target address in etcd. Specified by `--env APP=<vlalue>` in [Connect](#Connect).  |
| public   | boolean         | Set `true` to disable authentication. (Default: `false`)                                      |
| backends | number          | Set number of backend instances to enable load barancing. Set null or 0 to disable LB.        |

Route configurations can be write under `route` key of [configuration file](#Configuration).

#### Live-Configuration
You have to register JSON value of route configurations into etcd to Live-Configuration
```bash
$ docker exec -i etcd /etcdctl set /routes "$(cat /path/to/routes.json)"
```

#### Load barancing
Backend applications must be named `app-N` and registerd into etcd.
N is an integral number from 1 on up.

#### Example of `routes.json`
```json
[
  {
    "host": "foo.a.example.com",
    "app": "a",
    "etcd": "foo"
  },
  {
    "host": "bar.b.example.com",
    "url": "^/public.*$",
    "methods": ["GET", "HEAD"],
    "app": "b",
    "etcd": "bar",
    "public": true
  },
  {
    "host": "bar.b.example.com",
    "app": "b",
    "etcd": "bar",
    "backends": 3
  },
  {
    "host": "c.example.com",
    "app": "c",
    "target": "http://127.0.0.1:8080"
  }
]
```

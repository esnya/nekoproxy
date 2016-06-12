# Nekoporxy Configuration Example


- Routing
    - `chat.example.com` -> [Nekochat](https://github.com/ukatama/nekochat)
    - `board.example.com` - > [Nekoboard](https://github.com/ukatama/nekoboard)
- Twitter Authentication
- TLS
- Langs
    - [日本語版](https://github.com/ukatama/nekoproxy/blob/master/example/README.ja.md)

## Sample Values

- Twitter API KEY
    - `<CONSUMER_KEY>`
    - `<CONSUMER_SECRET>`
- Secret (Random string)
    - `<SECRET>`
- Subdomain
    - Nekochat: `chat.example.com`
    - Nekoboard: `board.example.com`
- MySQL
    - root password: `<MYSQL_ROOT_PASSWORD>`
    - database: `nekorpg`
    - data directory: `/path/to/mysql-data`
- Configuration Files
    - Nekoproxy: `/path/to/nekoproxy.yml`
        - Routes: `/path/to/routes.json`
    - Nekochat: `/path/to/nekochat.yml`
    - Nekoboard: `/path/to/nekoboard.yml`
- TLS Keys
    - `/path/to/tls/cert.pem`
    - `/path/to/tls/privkey.pem`

## Build Container

- Nekoproxy

    ```bash
    $ git clone --recursive https://github.com/ukatama/nekoproxy.git
    $ docker build -t ukatama/nekoproxy nekoproxy
    ```

- nekoetcd-connect

    ```bash
    $ git clone --recursive https://github.com/ukatama/nekoetcd-connect.git
    $ docker build -t ukatama/nekoetcd-connect nekoetcd-connect
    ```

- Nekochat

    ```bash
    $ git clone --recursive https://github.com/ukatama/nekochat.git
    $ docker build -t ukatama/nekochat nekochat
    ```

- Nekoboard

    ```bash
    $ git clone --recursive https://github.com/ukatama/nekoboard.git
    $ docker build -t ukatama/nekoboard nekoboard
    ```

## Create Configuration Files

- [`/path/to/nekoproxy.yml`](https://github.com/ukatama/nekoproxy/blob/master/example/nekoproxy.yml)
- [`/path/to/routes.json`](https://github.com/ukatama/nekoproxy/blob/master/example/routes.json)
- [`/path/to/nekochat.yml`](https://github.com/ukatama/nekoproxy/blob/master/example/nekochat.yml)
- [`/path/to/nekoboard.yml`](https://github.com/ukatama/nekoproxy/blob/master/example/nekoboard.yml)

## Run Containers

- Redis

    ```bash
    $ docker run --name redis --detach --restart always redis
    ```

- MySQL

    ```bash
    $ docker run --name mysql --detach --restart always \
        --env MYSQL_ROOT_PASSWORD="<MYSQL_ROOT_PASSWORD>" \
        --env MYSQL_DATABASE=nekorpg \
        --volume /path/to/mysql-data:/var/lib/mysql \
        mysql
    ```

- etcd

    ```bash
    $ docker run --name etcd --detach --restart always \
        quay.io/coreos/etcd \
        --listen-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001 \
        --advertise-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001
    ```

- Nekoproxy

    ```bash
    $ docker run --name nekoproxy --detach --restart always \
        --publish 80:80 --publish 443:443 \
        --link redis:redis \
        --link mysql:mysql \
        --link etcd:etcd \
        --volume /path/to/nekoproxy.yml:/usr/src/app/config/local.yml:ro \
        --volume /path/to/tls/cert.pem:/etc/cert/cert.pem:ro \
        --volume /path/to/tls/privkey.pem:/etc/cert/privkey.pem:ro \
        --env NODE_ENV=production \
        ukatama/nekoproxy
    ```

- Nekochat

    ```bash
    $ docker run --name nekochat --detach --restart always \
        --link redis:redis \
        --link mysql:mysql \
        --volume /path/to/nekochat.yml:/usr/src/app/config/local.yml:ro \
        --env NODE_ENV=production \
        ukatama/nekochat
    ```

- Nekoboard

    ```bash
    $ docker run --name nekoboard --detach --restart always \
        --link redis:redis \
        --volume /path/to/nekoboard.yml:/usr/src/app/config/local.yml:ro \
        --env NODE_ENV=production \
        ukatama/nekoboard
    ```

- nekoetcd-connect

    ```bash
    $ docker run --name nekochat-connect --detach --restart always \
        --link etcd:etcd \
        --link nekochat:nekochat \
        --env APP=nekochat \
        ukatama/nekoetcd-connect
    $ docker run --name nekoboard-connect --detach --restart always \
        --link etcd:etcd \
        --link nekoboard:nekoboard \
        --env APP=nekoboard \
        ukatama/nekoetcd-connect
    ```

## Set Routes

```
$ docker exec -i etcd /etcdctl set /routes "$(cat /path/to/routes.json)"
```

You can modify routes configuration without restarting `nekorpg` container.

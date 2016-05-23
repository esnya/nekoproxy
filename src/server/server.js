import {mapValues} from 'lodash';
import {readFileSync} from 'fs';
import {Server as HttpServer} from 'http';
import {Server as HttpsServer} from 'https';
import ProxyServer from 'http-proxy';
import {getLogger} from 'log4js';
import {createApps} from './app';
import * as Metrics from './metrics/metrics';
import {Router} from './router';

export class Server {
    constructor(config = {}, metrics) {
        this.metrics = metrics;

        this.server =
            new HttpServer((req, res) => this.onRequest(req, res));

        if (config.ssl) {
            this.httpsServer = new HttpsServer(
                mapValues(config.ssl, (file) => readFileSync(file)),
                (req, res) => this.onRequest(req, res)
            );
        }

        this.logger = getLogger('[server]');
        this.apps = createApps(config, metrics);
        this.proxy = new ProxyServer();
        this.router = new Router(config);

        this.on('upgrade', (...args) => this.onUpgrade(...args));
        this.proxy.on('proxyReq', (...args) => this.onProxyReq(...args));
        this.proxy.on('proxyRes', (...args) => this.onProxyRes(...args));
        this.proxy.on('error', (e) => this.logger.error(e));

        this.server.listen(config.server, () => this.onListen(this.server));
        if (this.httpsServer) {
            this.httpsServer.listen(
                config.sslServer,
                () => this.onListen(this.httpsServer)
            );
        }
    }

    on(...args) {
        this.server.on(...args);
        if (this.httpsServer) this.httpsServer.on(...args);
    }

    resolveRoute(req, res = null, cors = true) {
        return this.router.route({
                host: req.headers.host,
                url: req.url,
                method: req.method,
                remote: req.socket && req.socket.remoteAddress,
            })
            .then((route) => {
                if (!route || !(route.app in this.apps)) {
                    this.logger.debug('404', req.headers.host, req.url);
                    if (res) {
                        res.writeHead(404);
                        res.end('Not Found');
                    }

                    return Promise.reject('Not Found');
                }

                if (cors && req.headers.origin) {
                    const m = (/^https?:\/\/([^:\/]+)(:([0-9]+))?$/)
                        .exec(req.headers.origin);
                    if (m) {
                        return this.resolveRoute(req, null, false)
                            .then(() => {
                                req.cors = true;

                                return route;
                            })
                            .catch(() => route);
                    }
                }

                return route;
            });
    }

    onListen(server) {
        const {
            address,
            port,
        } = server.address();

        this.logger.info(`Listening on ${address} ${port}`);
    }

    onUpgrade(req, socket, head) {
        this.resolveRoute(req).then((route) => {
            this.proxy.ws(req, socket, head, route);
        });
    }

    onRequest(req, res) {
        try {
        const host = req.headers.host;
        const url = req.url;
        this.logger.debug('Request', host, req.url);

        this.metrics.increment(Metrics.InboundRequest, {
            host,
            method: req.method,
        });

        return this.resolveRoute(req, res)
            .then((route) => {
                const app = this.apps[route.app];
                const target = route.target;

                req.public = Boolean(route.public);

                this.metrics.increment(Metrics.ProxyRequest, {
                    app: route.app,
                    host,
                    target,
                    public: req.public,
                });

                app.handle(req, res, () => this.proxy.web(req, res, {
                    target,
                }));
            })
            .catch((e) => {
                this.logger.error(e);
                res.statusCode = 500;
                res.end();
            });
        } catch (e) {
            this.logger.error(e);
            res.statusCode = 500;
            res.end();

            return Promise.resolve();
        }
    }

    onProxyReq(proxyReq, req) {
        if (req.user && req.user.id) {
            proxyReq.setHeader('X-Forwarded-User', req.user.id);
        } else {
            proxyReq.removeHeader('X-Forwarded-User');
        }
    }

    onProxyRes(proxyRes, req, res) {
        if (req.cors) {
            const {
                host,
                origin,
            } = req.headers;

            this.logger.info('CORS', origin, 'on', host);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
    }
}

import { Server as HttpServer } from 'http';
import ProxyServer from 'http-proxy';
import { getLogger } from 'log4js';
import { createApps } from './app';
import { Router } from './router';

export class Server extends HttpServer {
    constructor(config = {}) {
        super((req, res) => this.onRequest(req, res));

        this.logger = getLogger('[server]');
        this.apps = createApps(config);
        this.proxy = new ProxyServer();
        this.router = new Router(config);

        this.on('upgrade', (...args) => this.onUpgrade(...args));
        this.proxy.on('proxyRes', (...args) => this.onProxyRes(...args));

        this.listen(config.server, () => this.onListen());
    }

    resolveRoute(req, res = null, cors = true) {
        return this.router.route(req.headers.host, req.url).then((route) => {
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

    onListen() {
        const {
            address,
            port,
        } = this.address();

        this.logger.info(`Listening on ${address} ${port}`);
    }

    onUpgrade(req, socket, head) {
        this.resolveRoute(req).then((route) => {
            this.proxy.ws(req, socket, head, route);
        });
    }

    onRequest(req, res) {
        this.logger.debug('Request', req.headers.host, req.url);

        this.resolveRoute(req, res).then((route) => {
            const app = this.apps[route.app];
            app.handle(req, res, () => this.proxy.web(req, res, {
                target: route.target,
            }));
        });
    }

    onProxyRes(proxyRes, req, res) {
        if (req.cors) {
            const {
                host,
                origin,
            } = req.headers;

            this.logger.info('CORS', origin, 'on', host);
            proxyRes.setHeader('Access-Control-Allow-Credentials', 'true');
            proxyRes.setHeader('Access-Control-Allow-Origin', origin);
        }
    }
}

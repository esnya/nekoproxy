import {createHash} from 'crypto';
import {Etcd} from './etcd';

export class Router {
    constructor(config = {}) {
        this.etcd = new Etcd(config.etcd);
        this.routes = config.routes;
    }

    getRoutes() {
        return this.routes === 'etcd'
            ? this
                .etcd
                .get('routes', true)
                .then((node) => JSON.parse(node.value))
            : Promise.resolve(this.routes);
    }

    matchRoute(routes, {host, url, method}) {
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];

            if (
                (!route.host || host === route.host) &&
                    (!route.url || (new RegExp(route.url)).exec(url)) &&
                    (
                        !route.methods ||
                            route.methods.indexOf(method.toUpperCase()) >= 0
                    )
            ) {
                return route;
            }
        }

        return null;
    }

    getBackend({etcd, backends}, {remote, host}) {
        if (!backends) return etcd;

        const hash = createHash('sha1');
        hash.update(`${remote}:${host}`);
        const n = hash.digest().readUInt8(0) % backends + 1;

        return `${etcd}-${n}`;
    }

    route({host, url, method, remote}) {
        return this
            .getRoutes()
            .then((routes) => {
                const route = this.matchRoute(routes, {host, url, method});

                if (!route || !route.etcd || !this.etcd) {
                    return route;
                }

                const backend = this.getBackend(route, {remote, host});

                return this.etcd.get(`backends/${backend}`, true)
                    .then((node) => ({
                        ...route,
                        target: node.value,
                    }));
            });
    }
}

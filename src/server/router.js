import { Etcd } from './etcd';

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

    route(host, url, method) {
        return this
            .getRoutes()
            .then((routes) => {
                const route = this.matchRoute(routes, {host, url, method});

                if (!route || !route.etcd || !this.etcd) {
                    return route;
                }

                const n = route.backends &&
                    Math.floor(Math.random() * route.backends) + 1;
                const backend = n ? `${route.etcd}-${n}` : route.etcd;

                return this.etcd.get(`backends/${backend}`, true)
                    .then((node) => ({
                        ...route,
                        target: node.value,
                    }));
            });
    }
}

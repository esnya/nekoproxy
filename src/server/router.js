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
                .then((routes) => JSON.parse(routes))
            : Promise.resolve(this.routes);
    }

    matchRoute(routes, host, url) {
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];

            if (
                (!route.host || host === route.host) &&
                    (!route.url || (new RegExp(route.url)).exec(url))
            ) {
                return route;
            }
        }

        return null;
    }

    route(host, url) {
        return this
            .getRoutes()
            .then((routes) => {
                const route = this.matchRoute(routes, host, url);

                if (!route || !route.etcd || !this.etcd) {
                    return route;
                }

                return this.etcd.get(`backends/${route.etcd}`, true)
                    .then((target) => ({
                        ...route,
                        target,
                    }));
            });
    }
}
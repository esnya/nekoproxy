import request from 'request-promise';

export class Etcd {
    constructor(config) {
        this.origin = `http://${config.host}:${config.port}`;
        this.cache = {};
    }

    watch(key, node) {
        this.cache[key] = node;

        request({
            json: true,
            uri: `${this.origin}/${key}?wait=true`,
        }).then((next) => {
            this.watch(key, next);
        }).catch(() => {
            this.cache[key] = false;
        });
    }

    get(key, watch = false) {
        if (watch && (key in this.cache) && this.cache[key] !== false) {
            return Promise.resolve(this.cache[key]);
        }

        return request({
            json: true,
            uri: `${this.origin}/${key}`,
        }).then((node) => {
            if (watch) this.watch(key, node);
            return node;
        });
    }
}
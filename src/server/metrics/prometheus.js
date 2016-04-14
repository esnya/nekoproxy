import express from 'express';
import {getLogger} from 'log4js';
import {Counter, register} from 'prom-client';
import * as Metrics from './metrics';

export class PrometheusCounter {
    constructor(config) {
        const {
            path,
            ...listen,
        } = config;
        const logger = getLogger('[metrics]');
        const app = express();

        app.get(path, (req, res) => res.end(register.metrics()));
        app.listen(listen, () => {
            logger.info(`Listening on ${config.host} ${config.port} ${path}`);
        });

        this.counters = {
            [Metrics.UserLogin]: new Counter(
                'user_logins_total', 'Total users logged in',
                [
                    'app',
                    'provider',
                    'user_id',
                ]
            ),
            [Metrics.ProxyRequest]: new Counter(
                'proxy_requests_total', 'Total requests',
                [
                    'app',
                    'host',
                    'target',
                    'public',
                ]
            ),
            [Metrics.InboundRequest]: new Counter(
                'http_requests_total', 'Total HTTP requests',
                [
                    'host',
                    'method',
                ]
            ),
        };

        Object.keys(Metrics)
            .map((key) => Metrics[key])
            .map((key) => ({key, counter: this.counters[key]}))
            .forEach(({key, counter}) => {
                this[key] = (value, tags) => counter.inc(value, tags);
            });
    }
}

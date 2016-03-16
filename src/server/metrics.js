import express from 'express';
import {getLogger} from 'log4js';
import {Counter, register} from 'prom-client';

export const logins =
    new Counter('user_logins_total', 'Total users logged in', [
        'app',
        'provider',
        'user_id',
    ]);

export const requests = new Counter('proxy_requests_total', 'Total requests', [
    'app',
    'host',
    'url',
    'target',
    'public',
]);

export const inbounds =
    new Counter('http_requests_total', 'Total HTTP requests', [
        'host',
        'method',
        'url',
    ]);

export const endpoint = (config = {}) => {
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
};

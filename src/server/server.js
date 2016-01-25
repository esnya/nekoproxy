import config from 'config';
import { Server } from 'http';
import { byName, byDomain } from './app';
import logger from './logger';
import { ws } from './proxy';

const Rules = config.get('rules');

export const server = new Server((req, res) => {
    logger.debug('Request', req.headers.host, req.url);
    
    const {
        host,
    } = req.headers;

    const rule = Rules[host];
    const app = rule ? byName(rule.app || 'default') : byDomain(host);

    const next = () => {
        logger.error('Proxy not found:', req.url, req.headers);
        res.socket.end();
    };

    if (!app) return next();

    return app.handle(req, res, next);
});

server.on('upgrade', ws);

server.listen(config.get('server'), () => {
    const address = server.address();
    const host = address.familiy === 'IPv6'
        ? `[${address.address}]`
        : address.address;

    logger.info(`Listening on ${host}:${address.port}`);
});
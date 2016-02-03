import config from 'config';
import { createProxyServer } from 'http-proxy';
import { get } from './etcd';
import { getLogger } from './logger';
import sessions from './session';

const rules = config.get('rules');
const logger = getLogger('[PROXY]');
const server = createProxyServer({});

const authenticate = (req, res, next) => {
    const rule = rules[req.headers.host];
    if (!rule) return next();

    if (!req.session) {
        return sessions[rule.app](req, res || {}, () =>{
            next(req.session &&
                req.session.passport &&
                req.session.passport.user
            );
        });
    }
    if (!req.session) return next();

    return next(req.session &&
        req.session.passport &&
        req.session.passport.user
    );
};

server.on('proxyReq', (proxyReq, req, res) => {
    authenticate(req, res, (id) => {
        if (id) {
            proxyReq.setHeader('X-Forwarded-User', id);
        } else {
            proxyReq.removeHeader('X-Forwarded-User');
        }
    });
});

server.on('proxyRes', (proxyRes, req, res) => {
    const {
        host,
        origin,
    } = req.headers;
    if (!host || !origin) return;

    const match = origin.match(/https?:\/\/(.*)$/);
    if (!match) return;

    if (!(match[1] in rules) && match[1] !== 'localhost') return;

    logger.info('CORS', origin, 'on', host);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
});

const proxy = (onProxy) => (req, res, next) => {
    const from = `http://${req.headers.host}${req.url}`;

    const rule = rules[req.headers.host];
    if (!rule) {
        logger.info('Route not found', req.headers.host);
        return next();
    }

    authenticate(req, res, (id) => {
        if (!id && !(rule.public && req.url.match(new RegExp(rule.public)))) {
            if (res) {
                req.session.redirectTo = from.replace(/\/favicon\.ico$/, '/');
                logger.info('Not authed on', from);
                return res.redirect('/login');
            }
            return next();
        }

        (
            rule.has('etcd')
                ? get(rule.get('etcd'))
                : Promise.resolve(rule.get('proxy'))
        )
        .then((p) => {
            logger.info('PROXY', from, 'to', p.target);
            return onProxy(p);
        })
        .catch((e) => {
            logger.error(e);
            return next();
        });
    });
};

export const web = (req, res, next) =>
    proxy((rule) => server.web(req, res, rule, next))(req, res, next);

export const ws = (req, sock, head) =>
    proxy(
        (rule) => server.ws(req, sock, head, rule)
    )(req, null, () =>{
        sock.write([
            'HTTP/1.1 401 Unauthorized',
            '',
            'Connection: close',
            '',
        ].join('\r\n'));
        sock.end();
    });

import config from 'config';
import { createProxyServer } from 'http-proxy';
import { getLogger } from './logger';
import sessions from './session';

const rules = config.get('rules');
const server = createProxyServer();
const logger = getLogger('[PROXY]');

server.on('proxyRes', (proxyRes, req, res) => {
    const {
        host,
        origin,
    } = req.headers;
    if (!host || !origin) return;

    const match = origin.match(/https?:\/\/(.*)$/);
    if (!match) return;

    if (!(match[1] in Proxy) && match[1] !== 'localhost') return;

    logger.info('CORS', 'from', origin, 'to', host);
    res.setHeader('Access-Control-Allow-Credentials', 'ture');
    res.setHeader('Access-Control-Allow-Origin', origin);
});

const proxy = (onProxy) => (req, res, next) => {
    const from = `http://${req.headers.host}${req.url}`;

    const rule = rules[req.headers.host];
    if (!rule) {
        logger.info('Route not found', req.headers.host);
        return next();
    }

    (new Promise((resolve) => {
        if (req.session) return resolve();
        sessions[rule.app](req, res || {}, resolve);
    }))
    .then(() => {
        if (!(req.user
                || rule.public
                && req.url.match(new RegExp(rule.public))
                || req.session.passport
                && req.session.passport.user
        )) {
            req.session.redirectTo = from;
            if (res) {
                return res.redirect(
                    `http://${config.get('apps').get(rule.app).get('domain')}/login/twitter`
                );
            }
            return next();
        }

        logger.info('PROXY', from, 'to', rule.get('proxy.target'));
        onProxy(rule.get('proxy'));
    })
    .catch((error) => {
        logger.error(error);
        next();
    });
};

export const web = (req, res, next) =>
    proxy((rule) => server.web(req, res, rule, next))(req, res, next);

export const ws = (req, sock, head) =>
    proxy(
        (rule) => server.ws(req, sock, head, rule)
    )(req, null, () => sock.end());

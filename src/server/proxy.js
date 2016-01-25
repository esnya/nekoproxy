import config from 'config';
import { createProxyServer } from 'http-proxy';
import { getLogger } from './logger';

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

const get = ({headers}) =>
    headers.host && rules[headers.host];

const forwardUser = (req) => {
    req.headers['X-Forwarded-User'] = req.user && req.user.id || '';
};

export const web = (req, res, next) => {
    const from = `http://${req.headers.host}${req.url}`;
    const rule = get(req);
    if (!rule) {
        logger.info(`Proxy not found`, from);
        return next();
    }

    const publicMatcher = rule.public && new RegExp(rule.public);
    const {
        url,
        user,
        session,
    } = req;

    if (!user && !(publicMatcher && publicMatcher.exec(url))) {
        logger.debug(rule.app);
        const to = 
            `http://${config.get('apps').get(rule.app || 'default').get('domain')}/auth/twitter`;
        logger.info('AuthRedirect', from, 'to', to);
        session.redirectTo = from;
        return res.redirect(to);
    }

    forwardUser(req);

    logger.info(
        'Proxy',
        from, 'to',
        rule.proxy
    );

    return server.web(req, res, rule.get('proxy'), (e) => res.send(e)); 
};

export const ws = (req, sock, head) => {
    console.log(req & sock && head && null);
};
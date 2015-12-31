'use strict';

let proxy = require('http-proxy').createProxyServer({});

let APP_PTN = new RegExp('^(?:https?:\/\/)?([a-zA-Z0-9-]+)\.'
        + process.env.SERVER_NAME.replace('.', '\\.') + '$');

proxy.on('proxyRes', function(proxyRes, req, res) {
    if (req.headers.host && req.headers.origin
            && req.headers.host.match(APP_PTN) && req.headers.origin.match(APP_PTN)) {
        console.log('CORS: ' + req.headers.origin + ' -> ' + req.headers.host);
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
});

const getApp = function(req) {
    let host = req.headers.host;
    if (host && host.match(APP_PTN)) {
        return host.match(APP_PTN)[1];
    }
};

const getTarget = function(req, proto) {
    let app = getApp(req);
    if (app) {
        let addr = process.env[app.toUpperCase() + '_PORT_80_TCP_ADDR'];
        if (addr) {
            let target = proto + '://' + addr;
            console.log('PROXY: ' + proto + '://' + req.headers.host + req.url + ' -> ' + target);
            return {
                target: target,
            };
        }
    }
};

const response = function(res, code, message) {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write(message);
    res.end();
};

const onError = function(req, res, sock) {
    return function(e) {
        if (res) {
            response(res, 500, 'Internal Server Error');
        } else if (sock) {
            sock.end();
        }

        if (req) {
            req.socket.end();
        }

        console.error(e);
    };
};

const forwardUser = function(req) {
    delete req.headers['username'];
    delete req.headers['Username'];
    delete req.headers['USERNAME'];
    delete req.headers['Remote-User'];
    delete req.headers['REDIRECT_REMOTE_USER'];
    delete req.headers['X-Forwarded-User'];

    if (!req.user) return;

    req.headers['WWW-Auth-Type'] = 'digest';
    req.headers['Username'] = 
        req.headers['Remote-User'] = 
        req.headers['Redirect-Remote-User'] = 
        req.headers['X-Forwarded-User'] = req.user.userid;
};

module.exports.web = function(req, res, next) {
    let target = getTarget(req, 'http');
    if (!target) {
        return next();
    }

    req.headers['X-Forwarded-From'] = req.socket.remoteAddress;

    let app = getApp(req);
    if (app) {
        let url = req.url;
        let ptn = process.env[app.toUpperCase() + '_PUBLIC_URL'];
        if (ptn && url && url.match(new RegExp(ptn))) {
            return proxy.web(req, res, target, onError(req, res));
        }
    }

    if (!req.user) {
        req.session.redirectTo = 'http://' + req.hostname + req.url;
        return res.redirect('http://' + (process.env.SERVER_NAME || 'localhost') + '/auth/twitter');
    }

    forwardUser(req);

    proxy.web(req, res, target, onError(req, res));
};

module.exports.ws = function(req, sock, head) {
    let target = getTarget(req, 'ws');
    if (target) {
        forwardUser(req);
        proxy.ws(req, sock, head, target, onError(req, null, sock));
    } else response(res, 404, 'Not Found');
};

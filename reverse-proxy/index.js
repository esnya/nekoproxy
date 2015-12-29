'use strict';

const http = require('http');
const httpProxy = require('http-proxy');
const httpDigest = require('./http-digest');

let APP_PTN = new RegExp('^(?:https?:\/\/)?([a-zA-Z0-9-]+)\.'
        + process.env.SERVER_NAME.replace('.', '\\.') + '$');

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
            console.log('PROXY: ' + proto + '://' + host + req.url + ' -> ' + target);
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

let proxy = httpProxy.createProxyServer({});

let server = http.createServer(function(req, res) {
    req.headers['X-Forwarded-From'] = req.socket.remoteAddress;

    let target = getTarget(req, 'http');
    if (!target) {
        return response(res, 404, 'Not Found');
    }

    let app = getApp(req);
    if (app) {
        let url = req.url;
        let ptn = process.env[app.toUpperCase() + '_PUBLIC_URL'];
        if (ptn && url && url.match(new RegExp(ptn))) {
            return proxy.web(req, res, target, onError(req, res));
        }
    }

    httpDigest(req, res, null, function() {
        proxy.web(req, res, target, onError(req, res));
    });
});

server.on('upgrade', function(req, sock, head) {
    httpDigest(req, null, null, function() {
        let target = getTarget(req, 'ws');
        if (target) proxy.ws(req, sock, head, target, onError(req, null, sock));
        else response(res, 404, 'Not Found');
    });
});

proxy.on('proxyRes', function(proxyRes, req, res) {
    if (req.headers.host && req.headers.origin
            && req.headers.host.match(APP_PTN) && req.headers.origin.match(APP_PTN)) {
        console.log('CORS: ' + req.headers.origin + ' -> ' + req.headers.host);
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
});

server.listen(80, function() {
    console.log('Listening on *:80');
});

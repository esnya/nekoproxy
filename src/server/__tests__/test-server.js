jest.mock('http');
jest.mock('http-proxy');
jest.mock('../page');
jest.dontMock('../server');

describe('Server', () => {
    const http = require('http');
    const Logger = require('log4js/lib/logger').Logger;
    const getLogger = require('log4js').getLogger;
    const ProxyServer = require('http-proxy');

    const {
        createApps,
        App,
    } = require('../app');

    const Server = require('../server').Server;

    let server;
    const apps = {
        app1: new App(),
    };
    it('listens as a http server', () => {
        getLogger.mockReturnValue(new Logger());

        createApps.mockReturnValue(apps);

        server = new Server({
            server: {
                host: 'localhost',
                port: 8080,
            },
        });

        expect(server.listen).toBeCalled();
        expect(server.listen.mock.calls[0][0]).toEqual({
            host: 'localhost',
            port: 8080,
        });

        const onListen = server.listen.mock.calls[0][1];
        server.address.mockReturnValueOnce({
            address: '127.0.0.1',
            port: 8080,
        });
        if (onListen) onListen();
    });

    pit('routes request by router', () => {
        const req = new http.IncomingMessage();
        req.url = '/';
        req.headers = {
            host: 'app.example.com',
        };
        const res = new http.ServerResponse();

        server.router.route.mockReturnValueOnce(Promise.resolve({
            app: 'app1',
        }));

        http
            .Server
            .mock
            .calls[0][0](req, res);

        expect(server.router.route).toBeCalledWith('app.example.com', '/');

        return Promise.resolve();
    });

    it('calls app.handle', () => {
        expect(apps.app1.handle).toBeCalled();
    });

    let proxy;
    it('calls proxy after authorized', () => {
        expect(ProxyServer.mock.instances.length).toBe(1);
        proxy = ProxyServer.mock.instances[0];

        server
            .apps
            .app1
            .handle
            .mock
            .calls[0][2]();
        expect(proxy.web).toBeCalled();
    });

    pit('responses 404 if route does not found', () => {
        const req = new http.IncomingMessage();
        req.url = '/';
        req.headers = {
            host: 'app.example.com',
        };
        const res = new http.ServerResponse();

        server.router.route.mockReturnValueOnce(Promise.resolve(null));

        http
            .Server
            .mock
            .calls[0][0](req, res);

        return Promise.resolve()
            .then(() => {
                expect(res.writeHead).toBeCalledWith(404);
                expect(res.end).toBeCalledWith('Not Found');
            });
    });

    pit('proxies WebSocket when upgrad requested', () => {
        proxy.ws.mockClear();

        const req = new http.IncomingMessage();
        req.url = '/';
        req.headers = {
            host: 'app.example.com',
        };
        const socket = 'socket';
        const head = 'head';

        server.router.route.mockReturnValueOnce(Promise.resolve({
            app: 'app1',
            target: 'http://ws.example.com',
        }));

        server
            .on
            .mock
            .calls
            .filter((call) => call[0] === 'upgrade')
            .forEach((call) => call[1](req, socket, head));

        return Promise.resolve()
            .then(() =>
                Promise.resolve().then(() =>
                    Promise.resolve()
                        .then(() => {
                            expect(proxy.ws).toBeCalled();
                        })
                )
            );
    });
});
describe('App', () => {
    const genMockMiddleware = () =>
        jest.genMockFn().mockImpl((req, res, next) => next());

    jest.mock('http');
    const {
        IncomingMessage,
        ServerResponse,
    } = require('http');

    const {Passport} = require('passport');

    jest.setMock('../session', {
        session: jest.genMockFn()
            .mockReturnValue(genMockMiddleware()),
    });

    jest.unmock('express');
    jest.unmock('../app');
    const {
        createApps,
        App,
    } = require('../app');

    const Metrics = require('../metrics/metrics');
    const {MetricCounter} = require('../metrics');

    let app, auth, metrics;
    it('can be instanced', () => {
        auth = genMockMiddleware;
        Passport
            .prototype
            .authenticate
            .mockReturnValueOnce(auth);

        Passport
            .prototype
            .initialize
            .mockReturnValueOnce(genMockMiddleware());
        Passport
            .prototype
            .session
            .mockReturnValueOnce(genMockMiddleware());

        metrics = new MetricCounter();

        app = new App({
            name: 'App',
            passport: {
                twitter: {
                    consumerKey: 'CONSUMER_KEY',
                    consumerSecret: 'CONSUMER_SEVRET',
                },
            },
        }, metrics);
    });

    it('redirects to /login if unauthorized', () => {
        const req = new IncomingMessage();
        req.url = '/';
        req.session = {};
        const res = new ServerResponse();
        res.redirect = jest.genMockFn();
        const next = jest.genMockFn();

        app.handle(req, res, next);

        expect(next).not.toBeCalled();
        expect(res.redirect).toBeCalledWith('/login');
        expect(req.session.loginRedirect).toEqual('/');
    });

    it('responds 401 for socket.io reqest if unauthorized', () => {
        const req = new IncomingMessage();
        req.url = '/socket.io';
        const res = new ServerResponse();
        const next = jest.genMockFn();

        app.handle(req, res, next);

        expect(next).not.toBeCalled();
        expect(res.statusCode).toBe(401);
    });

    pit('increments user login metric', () => {
        const strategy = Passport.prototype.use.mock.calls[0][0];
        const authenticate = strategy.constructor.mock.calls[0][1];

        app.users.find.mockReturnValue(Promise.resolve({
            id: 'user1',
            name: 'User 1',
        }));

        return new Promise((resolve, reject) => {
                authenticate(
                    'token',
                    'secret',
                    {id: 'user1'},
                    (e, user) => e ? reject(e) : resolve(user)
                );
            })
            .then((user) => {
                expect(user).toEqual({
                    id: 'user1',
                    name: 'User 1',
                });
                expect(metrics.increment).toBeCalledWith(Metrics.UserLogin, {
                    app: 'App',
                    provider: 'twitter',
                    user_id: 'user1',
                });
            })
            .catch((e) => {
                throw e;
            });
    });

    it('creates apps from object', () => {
        Passport
            .prototype
            .authenticate
            .mockReturnValue(auth);
        Passport
            .prototype
            .initialize
            .mockReturnValue(jest.genMockFn());
        Passport
            .prototype
            .session
            .mockReturnValue(jest.genMockFn());

        const config = {
            apps: {
                app1: {
                    name: 'App1',
                    signUp: false,
                },
                app2: {
                    name: 'App2',
                },
            },
            default: {
                signUp: true,
            },
        };

        const apps = createApps(config);

        expect(Object.keys(apps)).toEqual(['app1', 'app2']);
        expect(apps.app1.config).toEqual({
            name: 'App1',
            signUp: false,
        });
        expect(apps.app2.config).toEqual({
            name: 'App2',
            signUp: true,
        });
    });

    it('redirects to https', () => {
        app = new App({
            name: 'Proxy to HTTPS',
            passport: {
                twitter: {
                    consumerKey: 'CONSUMER_KEY',
                    consumerSecret: 'CONSUMER_SEVRET',
                },
            },
            sslRedirect: true,
        });

        const req = new IncomingMessage();
        req.protocol = 'http';
        req.headers = {
            host: 'localhost',
        };
        req.url = '/test/path';

        const res = new ServerResponse();
        res.redirect = jest.fn();

        const next = jest.genMockFn();

        app.handle(req, res, next);

        expect(res.redirect).toBeCalledWith('https://localhost/test/path');
        expect(next).not.toBeCalled();
    });

    it('proxies https', () => {
        const req = new IncomingMessage();
        req.protocol = 'https';
        req.headers = {
            host: 'localhost',
        };
        req.url = '/test/path';

        const res = new ServerResponse();
        res.redirect = jest.fn();

        const next = jest.genMockFn();

        app.handle(req, res, next);

        expect(res.redirect).not.toBeCalled();
    });
});

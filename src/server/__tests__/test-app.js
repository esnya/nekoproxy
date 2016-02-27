jest.autoMockOff();

jest.dontMock('express');
require('express');

jest.dontMock('../app');

jest.mock('http');
jest.mock('passport');
jest.mock('../page');
jest.mock('../session');

describe('App', () => {
    const {
        IncomingMessage,
        ServerResponse,
    } = require('http');

    jest.setMock('../session', {
        session: jest.genMockFn()
            .mockReturnValue(jest.genMockFn()),
    });

    /*
    const {
        transform,
    } = require('lodash');
    */

    const Passport = require('passport').Passport;

    jest.dontMock('lodash');
    const {
        createApps,
        App,
    } = require('../app');

    let app, auth;
    it('can be instanced', () => {
        auth = jest.genMockFn();
        Passport
            .prototype
            .authenticate
            .mockReturnValueOnce(auth);

        Passport
            .prototype
            .initialize
            .mockReturnValueOnce(jest.genMockFn());
        Passport
            .prototype
            .session
            .mockReturnValueOnce(jest.genMockFn());

        app = new App({
            passport: {
                twitter: {
                    consumerKey: 'CONSUMER_KEY',
                    consumerSecret: 'CONSUMER_SEVRET',
                },
            },
        });
    });

    it('redirects to /login if unauthorized', () => {
        const req = new IncomingMessage();
        req.url = '/';
        const res = new ServerResponse();
        const next = jest.genMockFn();

        app.handle(req, res, next);

        expect(next).not.toBeCalled();
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
});
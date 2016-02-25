jest.autoMockOff();

jest.dontMock('express');
require('express');

jest.mock('http');
jest.mock('passport');
jest.mock('../page');

jest.dontMock('../app');

describe('App', () => {
    const {
        IncomingMessage,
        ServerResponse,
    } = require('http');

    const ConnectSessionKnex = require('connect-session-knex');
    ConnectSessionKnex.mockReturnValue(jest.genMockFn());

    const Passport = require('passport').Passport;
    const App = require('../app').App;

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
});
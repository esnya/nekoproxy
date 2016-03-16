describe('metrics', () => {
    const app = {...require('express/lib/application')};
    const express = require('express');
    express.mockReturnValue(app);

    const {getLogger} = require('log4js');
    require('methods'); // eslint-disable-line node/no-unpublished-require
    const {Counter} = require('prom-client');

    jest.unmock('../metrics');
    const {logins, requests, endpoint} = require('../metrics');

    const logger = {
        info: jest.fn(),
    };
    it('listens as HTTP server', () => {
        getLogger.mockReturnValue(logger);

        endpoint({
            host: 'localhost',
            port: 8080,
            path: '/metrics',
        });

        expect(app.get.mock.calls.length).toBe(1);
        expect(app.get.mock.calls[0][0]).toEqual('/metrics');
        expect(app.listen.mock.calls.length).toBe(1);
        expect(app.listen.mock.calls[0][0]).toEqual({
            host: 'localhost',
            port: 8080,
        });
    });

    it('logs info', () => {
        app.listen.mock.calls[0][1]();
        expect(logger.info).toBeCalled();
    });

    it('exports metrics', () => {
        expect(Counter).toBeCalled();
        expect(Counter.mock.instances).toContain(logins);
        expect(Counter.mock.instances).toContain(requests);
    });
});

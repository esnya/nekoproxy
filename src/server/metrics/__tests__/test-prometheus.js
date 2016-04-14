describe('metrics/prometheus', () => {
    const app = {...require('express/lib/application')};
    const express = require('express');
    express.mockReturnValue(app);

    const {getLogger} = require('log4js');
    require('methods'); // eslint-disable-line node/no-unpublished-require
    const {Counter} = require('prom-client');

    const Metrics = require('../metrics');

    jest.unmock('../prometheus');
    const {PrometheusCounter} = require('../prometheus');

    const logger = {
        info: jest.fn(),
    };

    let counter;
    it('creates counters', () => {
        getLogger.mockReturnValue(logger);

        counter = new PrometheusCounter({
            host: 'localhost',
            port: 8080,
            path: '/metrics',
        });

        expect(Counter).toBeCalled();
        expect(Counter.mock.instances)
            .toContain(counter.counters[Metrics.USER_LOGIN]);
        expect(Counter.mock.instances)
            .toContain(counter.counters[Metrics.PROXY_REQUEST]);
        expect(Counter.mock.instances)
            .toContain(counter.counters[Metrics.INBOUND_REQUEST]);
    });

    it('listens as HTTP server', () => {
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
});

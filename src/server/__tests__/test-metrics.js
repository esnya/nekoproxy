describe('metrics', () => {
    const {getLogger} = require('log4js');

    jest.unmock('../metrics');
    const {MetricCounter} = require('../metrics');
    const Metrics = require('../metrics/metrics');
    const {PrometheusCounter} = require('../metrics/prometheus');

    it('increments counter', () => {
        const counter = new MetricCounter({});
        const inc = jest.fn();
        counter.counters.push({
            [Metrics.UserLogin]: inc,
        });
        counter.increment(Metrics.UserLogin, {label: 'label'});
        expect(inc).toBeCalledWith({label: 'label'}, 1);
    });

    it('includes prometheus counter', () => {
        PrometheusCounter.mockClear();

        const counter = new MetricCounter({
            prometheus: {path: '/metrics'},
        });
        expect(counter.counters.length > 0).toBe(true);
        expect(PrometheusCounter).toBeCalledWith({
            path: '/metrics',
        });
    });
});

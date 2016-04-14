import {PrometheusCounter} from './prometheus';

export class MetricCounter {
    constructor(config) {
        this.counters = [];

        if (config.prometheus) {
            this.counters.push(new PrometheusCounter(config.prometheus));
        }
    }

    increment(metric, tags = {}, value = 1) {
        this.counters.forEach((counter) =>
            counter[metric] && counter[metric](tags, value)
        );
    }
}

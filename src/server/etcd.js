import config from 'config';
import { getLogger } from 'log4js';
import request from 'request-promise';

const logger = getLogger('[etcd]');

const {
    hostname,
    port,
} = config.get('etcd');

const cache = {};

const watch = (target) => {
    logger.info('Watching', target);

    request({
        uri: `http://${hostname}:${port}/v2/keys/${target}?wait=true`,
        json: true,
    })
    .then((res) => {
        const value = res.node.value;

        logger.info('Update', target, cache[target], ' > ', value);

        cache[target] = value;

        return watch(target);
    });
};

export const get = (target) => {
    if ((target in cache) && cache[target]) {
        return Promise.resolve({
            target: `http://${cache[target]}`,
        });
    }

    logger.info('Get', target);

    return request({
        uri: `http://${hostname}:${port}/v2/keys/${target}`,
        json: true,
    })
    .then((res) => {
        const value = res.node.value;

        cache[target] = value;
        watch(target);

        return {
            target: `http://${value}`,
        };
    });
};
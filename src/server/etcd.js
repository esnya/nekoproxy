import config from 'config';
import request from 'request-promise';

const {
    hostname,
    port,
} = config.get('etcd');

export const get = (target) =>
    request({
        uri: `http://${hostname}:${port}/v2/keys/${target}`,
        json: true,
    })
    .then((res) => Promise.resolve({
        target: `http://${res.node.value}`,
    }, res));
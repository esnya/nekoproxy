jest.dontMock('../etcd');

describe('Etcd', () => {
    const request = require('request-promise');
    const Etcd = require('../etcd').Etcd;

    let etcd;
    it('created from config object', () => {
        etcd = new Etcd({
            host: 'etcd.example.com',
            port: 4001,
        });
    });

    pit('gets value', () => {
        request.mockReturnValueOnce(Promise.resolve({
            node: { value: 'test-value1' },
        }));

        return etcd.get('test-key1').then((value) => {
            expect(request)
                .toBeCalledWith({
                    uri: 'http://etcd.example.com:4001/v2/keys/test-key1',
                    json: true,
                });
            expect(value.value).toEqual('test-value1');
        });
    });

    pit('watches value of key', () => {
        request.mockClear();

        const mockPromise = [];
        request.mockImpl(({ uri }) => {
            if (!uri.match(/wait=true$/)) {
                return Promise.resolve({
                    node: { value: 'test-value2' },
                });
            }

            return new Promise((resolve, reject) => {
                mockPromise.push({resolve, reject});
            });
        });

        return etcd
            .get('test-key2', true)
            .then((node) => {
                expect(request.mock.calls.length).toBe(2);
                expect(request.mock.calls[0][0])
                    .toEqual({
                        uri: 'http://etcd.example.com:4001/v2/keys/test-key2',
                        json: true,
                    });
                expect(request.mock.calls[1][0])
                    .toEqual({
                        uri:
                            'http://etcd.example.com:4001/v2/keys/test-key2?wait=true',
                        json: true,
                    });

                expect(node.value).toEqual('test-value2');
            })
            .then(() => {
                request.mockClear();

                return etcd.get('test-key2', true);
            })
            .then((node) => {
                expect(request).not.toBeCalled();
                expect(node.value).toEqual('test-value2');
            })
            .then(() => {
                request.mockClear();
                mockPromise[0].resolve({
                    node: { value: 'test-value3' },
                });
                mockPromise.shift();
            })
            .then(() => etcd.get('test-key2', true))
            .then((node) => {
                expect(request.mock.calls.length).toBe(1);
                expect(request.mock.calls[0][0])
                    .toEqual({
                        uri:
                            'http://etcd.example.com:4001/v2/keys/test-key2?wait=true',
                        json: true,
                    });
                expect(node.value).toEqual('test-value3');

                mockPromise[0].reject();
                mockPromise.shift();
            })
            .catch((e) => {
                expect(e).toBeNull();
            });
    });
});

jest.dontMock('../router');

describe('Router', () => {
    const Etcd = require('../etcd').Etcd;

    const Router = require('../router').Router;

    const routes = [
        {
            app: 'app3',
            host: 'app2.example.com',
            methods: ['POST', 'PUT'],
            target: 'http://target-app2.example.com',
        },
        {
            app: 'app1',
            host: 'app1.example.com',
            target: 'http://target-app1.example.com',
        },
        {
            app: 'app2',
            host: 'app2.example.com',
            url: '^/public',
            target: 'http://target-app2.example.com',
        },
        {
            app: 'app2',
            host: 'app2.example.com',
            etcd: 'app2',
        },
        {
            app: 'app4',
            host: 'app4.example.com',
            etcd: 'app4',
            backends: 3,
        },
    ];

    let etcd, router;
    it('generates etcd client', () => {
        router = new Router({
            etcd: {
                host: 'localhost',
                port: 4001,
            },
            routes,
        });

        expect(Etcd.mock.instances.length).toBe(1);
        expect(Etcd).toBeCalledWith({
            host: 'localhost',
            port: 4001,
        });

        etcd = Etcd.mock.instances[0];
    });

    pit('routes by host', () =>
        router.route('app1.example.com', '/the/path', 'GET')
            .then((route) => {
                expect(route).toEqual(routes[1]);
            })
    );

    pit('routes by path', () =>
        router.route('app2.example.com', '/public/path', 'GET')
            .then((route) => {
                expect(route).toEqual(routes[2]);
            })
    );

    pit('routes by methods', () =>
        router.route('app2.example.com', '/public/path', 'POST')
            .then((route) => {
                expect(route).toEqual(routes[0]);
            })
    );

    pit('returns null when any route does not match', () =>
        router.route('no-match.example.com', '/').then((route) => {
            expect(route).toBeNull();
        })
    );

    pit('gets backends from etcd', () => {
        etcd.get.mockReturnValueOnce(
            Promise.resolve({ value: 'http://etcd-target-app2.example.com' })
        );

        return router.route('app2.example.com', '/', 'GET').then((route) => {
                expect(route).toEqual({
                    ...routes[3],
                    target: 'http://etcd-target-app2.example.com',
                });
                expect(etcd.get).toBeCalledWith('backends/app2', true);
            });
    });

    pit('gets frontends on etcd', () => {
        Etcd.mockClear();

        const erouter = new Router({
            etcd: {
                host: 'etcd.example.com',
                port: 7001 ,
            },
            routes: 'etcd',
        });

        expect(Etcd).toBeCalledWith({
            host: 'etcd.example.com',
            port: 7001,
        });
        expect(Etcd.mock.instances.length).toBe(1);
        const etcd2 = Etcd.mock.instances[0];

        etcd2.get.mockReturnValueOnce(
            Promise.resolve({ value: JSON.stringify(routes) })
        );

        return erouter.route('app1.example.com', '/public/path', 'GET')
            .then((route) => {
                expect(etcd2.get).toBeCalledWith('routes', true);
                expect(route).toEqual(routes[1]);
            });
    });

    pit('routes as loadbarancer', () => {
        Math.random = jest.fn().mockReturnValue((3.2 - 1) / 3);

        etcd.get.mockReturnValueOnce(
            Promise.resolve({ value: 'http://etcd-target-app4.example.com' })
        );

        return router.route('app4.example.com', '/', 'GET').then((route) => {
                expect(route).toEqual({
                    ...routes[4],
                    target: 'http://etcd-target-app4.example.com',
                });
                expect(etcd.get).toBeCalledWith('backends/app4-3', true);
            });
    });
});

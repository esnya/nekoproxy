describe('session', () => {
    const ConnectSessionKnex = require('connect-session-knex');
    const ConnectRedis = require('connect-redis');
    const Session = require('express-session');

    jest.unmock('../session');
    const session = require('../session').session;

    beforeEach(() => {
        ConnectSessionKnex.mockClear();
        ConnectRedis.mockClear();
        Session.mockClear();
    });

    it('creates a session stored on knex', () => {
        const knex = {};
        const config = {
            session: {
                secret: 'secret',
                store: 'knex',
            },
        };
        const Store = jest.fn();
        ConnectSessionKnex.mockReturnValueOnce(Store);

        session(knex, config);

        expect(ConnectSessionKnex).toBeCalledWith(Session);
        expect(Store).toBeCalledWith({ knex });
        expect(Store.mock.instances.length).toBe(1);
        expect(Session).toBeCalledWith({
            secret: 'secret',
            store: Store.mock.instances[0],
        });
    });

    it('creates a session stored on Redis', () => {
        const knex = {};
        const config = {
            session: {
                secret: 'secret',
                store: 'redis',
            },
            redis: {
                host: 'redis-host',
                port: 1234,
            },
        };
        const Store = jest.fn();
        ConnectRedis.mockReturnValueOnce(Store);

        session(knex, config);

        expect(ConnectRedis).toBeCalledWith(Session);
        expect(Store).toBeCalledWith({
            host: 'redis-host',
            port: 1234,
        });
        expect(Store.mock.instances.length).toBe(1);
        expect(Session).toBeCalledWith({
            secret: 'secret',
            store: Store.mock.instances[0],
        });
    });
});

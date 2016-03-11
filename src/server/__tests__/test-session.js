describe('session', () => {
    const ConnectSessionKnex = require('connect-session-knex');
    const Session = require('express-session');

    jest.unmock('../session');
    const session = require('../session').session;

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
});

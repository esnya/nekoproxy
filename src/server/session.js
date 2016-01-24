import config from 'config';
import session from 'express-session';
import ConnectSessionKnex from 'connect-session-knex';
import db from './db';

const KnexSessionStore = ConnectSessionKnex(session);

module.exports = session(Object.assign({}, config.get('session'), {
    store: new KnexSessionStore({
        knex: db,
    }),
}));

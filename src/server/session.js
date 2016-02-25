import ConnectSessionKnex from 'connect-session-knex';
import Session from 'express-session';
import Knex from 'knex';

/**
 * Get session middleware.
 * @param{object} config - Configuration object
 * @returns{Middleware} Middleware
 */
export function session(config) {
    const knex = new Knex(config.database);
    const KnexSessionStore = ConnectSessionKnex(Session);

    return Session({
        ...config.session,
        store: new KnexSessionStore({ knex }),
    });
}

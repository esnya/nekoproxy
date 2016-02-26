import ConnectSessionKnex from 'connect-session-knex';
import Session from 'express-session';

/**
 * Get session middleware.
 * @param{Knex} knex - Instance of Knex client.
 * @param{object} config - Configuration object.
 * @returns{Middleware} express.js middleware.
 */
export function session(knex, config) {
    const KnexSessionStore = ConnectSessionKnex(Session);

    return Session({
        ...config.session,
        store: new KnexSessionStore({ knex }),
    });
}

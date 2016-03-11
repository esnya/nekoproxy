import ConnectSessionKnex from 'connect-session-knex';
import ConnectRedis from 'connect-redis';
import Session from 'express-session';

/**
 * Get session store
 * @param{Knex} knex - Instance of Knex client
 * @param{object} config - Configuration object
 * @returns{any} session store object
 */
function getStore(knex, config) {
    const type = config.session.store;

    switch (type) {
        case 'knex':
            return new (ConnectSessionKnex(Session))({ knex });
        case 'redis':
            return new (ConnectRedis(Session))(config.redis);
        default:
            throw new Error(`Unsupported store type: ${type}`);
    }
}

/**
 * Get session middleware.
 * @param{Knex} knex - Instance of Knex client.
 * @param{object} config - Configuration object.
 * @returns{Middleware} express.js middleware.
 */
export function session(knex, config) {
    return Session({
        ...config.session,
        store: getStore(knex, config),
    });
}

import config from 'config';
import ConnectSessionKnex from 'connect-session-knex';
import ConnectRedis from 'connect-redis';
import session from 'express-session';
import { getLogger } from 'log4js';
import { transform } from 'lodash';
import { createClient } from 'redis';
import knex from './knex';

const logger = getLogger('[SESSION]');
const KnexSessionStore = ConnectSessionKnex(session);
const RedisStore = ConnectRedis(session);

export default transform(config.get('apps'), (results, appConfig, name) => {
    const type = appConfig.get('session.store');
    switch (type) {
        case 'database':
            results[name] = new KnexSessionStore({
                knex: knex[name],
            });
            break;
        case 'redis': {
            const redisLogger = getLogger(`[REDIS:${name}]`);
            const client = createClient(appConfig.get('redis'));
            client.on('error', (e) => {
                redisLogger.error(e);
            });
            results[name] = new RedisStore(client);
            break;
        } default:
            throw new Error(`Invalid store type: ${type}`);
    }
    logger.info(`Session store for ${name} on ${type} is initialized.`);
});
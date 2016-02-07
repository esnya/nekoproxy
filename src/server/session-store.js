import config from 'config';
import ConnectSessionKnex from 'connect-session-knex';
import ConnectRedis from 'connect-redis';
import session from 'express-session';
import { getLogger } from 'log4js';
import { transform } from 'lodash';
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
        case 'redis':
            results[name] = new RedisStore(appConfig.get('redis'));
            break;
        default:
            throw new Error(`Invalid store type: ${type}`);
    }
    logger.info(`Session store for ${name} on ${type} is initialized.`);
});
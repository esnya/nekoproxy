import config, { util } from 'config';
import Knex from 'knex';
import lodash from 'lodash';
import { getLogger } from './logger';

export default lodash(config.get('apps'))
    .transform((result, appConfig, name) => {
        util.extendDeep(appConfig, config.get('default'));

        const logger = getLogger(`[${name}]`);
        const knex = result[name] = Knex(appConfig.get('database'));

        const createTable = (table, creator) => 
            knex.schema.hasTable(table)
                .then(
                    (exists) => exists
                        ? Promise.resolve()
                        : knex.schema.createTable(table, creator)
                );

        createTable('users', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.string('oauth_provider');
            table.string('oauth_id');
            table.boolean('enabled').notNullable().defaultTo(true);
            table.timestamp('created').notNullable();
            table.timestamp('modified').notNullable();
            table.timestamp('deleted');
            table.unique('name');
            table.unique(['oauth_provider', 'oauth_id']);
        })
        .then(() => logger.info('Database initialized'))
        .catch((e) => logger.error('Failed to initialize database', e));
    })
    .value();
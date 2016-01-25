import config, { util } from 'config';
import session from 'express-session';
import ConnectSessionKnex from 'connect-session-knex';
import lodash from 'lodash';
import knex from './knex';

const KnexSessionStore = ConnectSessionKnex(session);

export default lodash(config.get('apps'))
    .transform((result, appConfig, name) => {
        util.extendDeep(appConfig, config.get('default'));

        result[name] = session({
            ...appConfig.get('session'),
            cookie: {
                ...appConfig.get('session').cookie,
                domain: appConfig.get('domain'),
            },
            store: new KnexSessionStore({
                knex: knex[name],
            }),
        });
    })
    .value();
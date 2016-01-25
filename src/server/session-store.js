import config from 'config';
import ConnectSessionKnex from 'connect-session-knex';
import session from 'express-session';
import { transform } from 'lodash';
import knex from './knex';

const KnexSessionStore = ConnectSessionKnex(session);

export default transform(config.get('apps'), (results, {}, name) => {
    results[name] = new KnexSessionStore({
        knex: knex[name],
    });
});
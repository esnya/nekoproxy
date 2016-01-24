'use strict';

const config = require('config');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('./db');

module.exports = session(Object.assign({}, config.get('session'), {
    store: new KnexSessionStore({
        knex: db,
    })
}));

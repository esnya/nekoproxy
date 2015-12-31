'use strict';

const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('./db');

module.exports = session({
    cookie: {
        domain: process.env.SERVER_NAME,
    },
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new KnexSessionStore({
        knex: require('./db'),
    }),
});

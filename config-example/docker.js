'use strict';

var name = process.env.SERVER_NAME || 'localhost';
var proxy = {};

Object.keys(process.env)
    .map((key) => ({
        match: key.match(/^([A-Z]+)_PORT_80_TCP_ADDR$/),
        target: process.env[key],
    }))
    .filter((e) => e.match)
    .map((e) => ({
        name: e.match[1].toLowerCase(),
        target: e.target,
    }))
    .forEach((e) => {
        proxy[e.name] = {
            name: e.name,
            target: e.target,
            public: process.env[e.name.toUpperCase() + '_PUBLIC_URL'],
        }
    });

module.exports = {
    name: name,
    oauth: {
        twitter: {
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        },
    },
    session: {
        cookie: {
            domain: process.env.SERVER_NAME || 'localhost',
        },
        resave: true,
        saveUninitialized: true,
        secret: process.env.SESSION_SECRET,
    },
    database: {
        client: 'mysql',
        connection: {
            host: process.env.MYSQL_PORT_3306_TCP_ADDR,
            user: 'root',
            password: process.env.MYSQL_ROOT_PASSWORD,
            database: 'www_users'
        },
    },
    proxy: proxy,
};
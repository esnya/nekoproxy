'use strict';

module.exports = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.MYSQL_PORT_3306_TCP_ADDR,
        user: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: 'www_users'
    },
});

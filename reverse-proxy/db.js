'use strict';

const mysql = require('mysql');

let connection = mysql.createConnection({
    host: process.env.MYSQL_PORT_3306_TCP_ADDR,
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'www_users'
});
connection.connect();

module.exports = connection;

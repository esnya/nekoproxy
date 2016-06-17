'use strict';

const { spawn } = require('child_process');
const config = require('config');
const { map, uniq } = require('lodash');

const aliases = {
    maria: 'mariasql',
    madiadb: 'mariasql',
    postgres: 'pq',
    postgresql: 'pq',
    sqlite: 'sqlite3',
};

const clients = uniq(
    [config.get('default.database.client')]
            .concat(map(config.get('apps'), (app) => app.get('database.client')))
            .map((client) => aliases[client] || client)
);

const isInstalled = (client) => {
    try {
        console.log('checking module', client);
        require(client);
        console.log(client, 'is already installed.');

        return true;
    } catch (e) {
        console.log(client, 'is not installed.');

        return false;
    }
};

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const install = (client) => new Promise((resolve, reject) => {
    if (isInstalled(client)) return resolve();

    console.log('> npm install', client);

    const child = spawn(
        npm,
        ['install', client],
        { stdio: 'inherit' }
    );

    child.on('exit', (code) => !code ? resolve(code) : reject(code));
});

const next = (clients) =>
    clients.length > 0
        ? install(clients[0]).then(() => next(clients.slice(1)))
        : Promise.resolve(0);

next(clients)
    .catch((code) => code)
    .then((code) => process.exit(code));

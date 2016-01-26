/* eslint max-len: 0 */

import config from 'config';
import express from 'express';
import { Server } from 'http';
import lodash from 'lodash';
import log4js from 'log4js';
import IO from 'socket.io';
import sessions from './session';
import url from 'url';

lodash(config.get('rules'))
    .map((rule, key) => ({
        app: rule.get('app') || 'default',
        name: [
            rule.get('app'),
            key.replace(new RegExp(
                `.${config.get('apps').get(rule.get('app')).get('domain')}$`
            ), ''),
        ].join('-'),
        port: url.parse(rule.get(`proxy.target`)).port,
    }))
    .uniqBy('port')
    .forEach((appConfig) => {
        const logger = log4js.getLogger(`[MOCK:${appConfig.name}]`);

        const app = express();

        app.use(sessions[appConfig.app]);

        app.get('/socket', ({}, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>socket</title>
                    <script src="https://cdn.socket.io/socket.io-1.4.3.js"></script>
                </head>
                <body>
                    <input id="input">
                    <button id="send">send</button>
                    <div id="list"></div>
                    <script>
                        var socket = io('/', {
                            transports: ['websocket'],
                        });
                        socket.on('message', function(message) {
                            document.getElementById('list').innerHTML += '<br>' + message;
                        });
                        document.getElementById('send').addEventListener('click', function() {
                            socket.emit('message', document.getElementById('input').value);
                        });
                    </script>
                </body>
                </html>
            `);
        });

        app.use((req, res) => {
            logger.info(`${req.method} ${req.headers.host}${req.url}`);
            res.send({
                app: appConfig.name,
                host: req.headers.host,
                url: req.url,
                headers: req.headers,
                session: req.session,
            });
        });

        const server = new Server(app);
        server.listen(appConfig.port, () => {
            logger.info(`Listening on localhost:${server.address().port}`);
        });

        const io = IO(server);
        io.on('connection', (socket) => {
            logger.info('Socket.IO connected', socket.id);

            socket.on('message', (message) => io.emit('message', message));
        });
    });
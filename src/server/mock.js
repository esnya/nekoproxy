/* eslint max-len: 0 */

import config from 'config';
import express from 'express';
import { Server } from 'http';
import lodash from 'lodash';
import log4js from 'log4js';
import IO from 'socket.io';
import url from 'url';
import { session } from './session';

lodash(config.get('routes'))
    .map((rule) => ({
        app: rule.app || 'default',
        name: [
            rule.app,
            rule.host,
        ].join('-'),
        port: url.parse(rule.target).port,
    }))
    .uniqBy('port')
    .forEach((appConfig) => {
        const logger = log4js.getLogger(`[MOCK:${appConfig.name}]`);

        const app = express();

        app.use(session(config.get('apps').get(appConfig.app)));

        app.get('/socket', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>socket</title>
                    <script src="https://cdn.socket.io/socket.io-1.4.3.js"></script>
                </head>
                <body>
                    <button id="connect">connect</button>
                    <input id="input">
                    <button id="send">send</button>
                    <div id="list"></div>
                    <script>
                        var socket;
                        document.getElementById('connect').addEventListener('click', function() {
                            socket = io('/', {
                                transports: ['websocket'],
                            });
                            socket.on('message', function(message) {
                                document.getElementById('list').innerHTML += '<br>' + message;
                            });
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
import config from 'config';
import express from 'express';
import { Server } from 'http';
import lodash from 'lodash';
import log4js from 'log4js';
import sessions from './session';
import url from 'url';

if (config.get('mock')) {
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
        .forEach((app) => {
            const logger = log4js.getLogger(`[MOCK:${app.name}]`);

            const exp = express();

            exp.use(sessions[app.app]);

            exp.use((req, res) => {
                logger.info(`${req.method} ${req.headers.host}${req.url}`);
                res.send({
                    app: app.name,
                    host: req.headers.host,
                    url: req.url,
                    headers: req.headers,
                    session: req.session,
                });
            });

            const server = new Server(exp);
            server.listen(app.port, () => {
                logger.info(`Listening on localhost:${server.address().port}`);
            });
        });
}
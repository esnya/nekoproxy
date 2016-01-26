/* eslint max-params: [2, 4] */

import config, { util } from 'config';
import lodash from 'lodash';
import { Passport } from 'passport';
import logger from './logger';
import knex from './knex';
import Strategy from './passport-strategy';

export default lodash(config.get('apps'))
    .transform((result, appConfig, name) => {
        util.extendDeep(appConfig, config.get('default'));

        const passport = result[name] = new Passport();

        lodash(appConfig.get('passport'))
            .map((providerConfig, providerName) => new Strategy[providerName]({
                    ...providerConfig,
                    callbackURL:
                        `http://${appConfig.get('domain')}/login/${providerName}/callback`,
                },
                (token, tokenSecret, profile, next) => {
                        logger.info('Authenticate', providerName, profile.id);
                        knex[name]('users')
                            .where({
                                enabled: true,
                                oauth_provider: 'twitter',
                                oauth_id: profile.id,
                            })
                        .first('id', 'name')
                        .then((user) => {
                            logger.info(
                                `Authenticated: twitter: ${profile.id} > ${JSON.stringify(user)}`
                            );
                            next(null, user);
                        }, next);
                }
            ))
            .forEach((strategy) => passport.use(strategy));

        passport.serializeUser((user, next) => {
            logger.info('Serialize user:', user);
            return next(null, user.id);
        });

        passport.deserializeUser((id, next) => {
            logger.info('Deserialize user:', id);
            knex[name]('users')
                .where({
                    enabled: true,
                    id,
                })
            .first('id', 'name')
            .then((user) => next(null, user), next);
        });
    })
    .value();
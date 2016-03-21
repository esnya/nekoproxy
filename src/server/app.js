/* eslint max-params: [2, 4] */
/* eslint global-require: 0 */

import express from 'express';
import Knex from 'knex';
import {defaultsDeep, forEach, transform} from 'lodash';
import {getLogger} from 'log4js';
import {Passport} from 'passport';
import path from 'path';

import {logins} from './metrics';
import {render} from './page';
import {session} from './session';
import {USER_NOT_FOUND, UserModel} from './user';

export class App {
    constructor(config) {
        this.config = config;
        this.logger = getLogger(`[app-${config.name}]`);

        const knex = this.knex = new Knex(config.database);
        const users = this.users = new UserModel(knex);
        const passport = this.passport = new Passport();

        forEach(config.passport, (value, key) => {
            const Strategy = require(`passport-${key}`).Strategy;

            passport.use(new Strategy({
                ...value,
                callbackURL: `/login/callback/${key}`,
            }, (token, tokenSecret, profile, next) => {
                users
                    .find({
                        oauth_provider: key,
                        oauth_id: profile.id,
                    })
                    .catch((e) => {
                        if (e !== USER_NOT_FOUND) return e;

                        return users.create({
                            id: profile.username,
                            name: profile.displayName,
                            oauth_provider: key,
                            oauth_id: profile.id,
                        });
                    })
                    .then((user) => {
                        logins.inc({
                            app: config.name,
                            provider: key,
                            user_id: user.id,
                        });

                        return next(null, user);
                    })
                    .catch(next);
            }));
        });

        passport.serializeUser((user, next) => {
            next(null, user.id);
        });
        passport.deserializeUser((id, next) => {
            users.deserialize(id)
                .then((user) => next(null, user))
                .catch(next);
        });

        const app = this.app = express();

        if (config.sslRedirect) {
            app.use((req, res, next) => {
                if (req.protocol === 'https') return next();

                return res.redirect(`https://${req.headers.host}${req.url}`);
            });
        }

        app.use(session(knex, config));
        app.use(passport.initialize());
        app.use(passport.session());

        app.set('view engine', 'jade');
        app.set('views', path.join(__dirname, '../..', 'views'));

        app.get('/login/callback/:provider', (req, res, next) => {
            if (req.user || req.public) return next();

            passport.authenticate(req.params.provider, {
                successRedirect: '/',
                failureRedirect: '/login',
            })(req, res, next);
        });

        app.get('/login/:provider', (req, res, next) => {
            if (req.user || req.public) return next();

            passport.authenticate(req.params.provider)(req, res, next);
        });

        app.get('/login', (req, res, next) => {
            if (req.user || req.public) return next();

            return res.render('static', {
                title: 'Login',
                body: render('Login', {
                    providers: Object.keys(config.passport),
                }),
            });
        });

        app.get('/logout', (req, res, next) => {
            if (!req.user || req.public) return next();

            req.logout();

            return res.redirect('/');
        });

        app.use((req, res, next) => {
            if (req.user || req.public) return next();

            if (req.url.match(/socket.io/)) {
                res.sendStatus(401);
            } else {
                req.session.loginRedirect = req.url;
                res.redirect('/login');
            }
        });
    }

    handle(req, res, next) {
        return this.app.handle(req, res, (err) => {
            if (err) {
                this.logger.error(err);

                return;
            }
            next();
        });
    }
}

/**
 * Create all App instances from config.
 * @param{object} config - Configuration object.
 * @return{object} Instance of Apps.
 */
export function createApps(config) {
    return transform(config.apps, (result, value, key) => {
        result[key] = new App(defaultsDeep(value, config.default));
    });
}

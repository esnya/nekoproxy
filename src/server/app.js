/* eslint max-params: [2, 4] */
/* eslint global-require: 0 */

import { forEach, transform } from 'lodash';
import ConnectSessionKnex from 'connect-session-knex';
import express from 'express';
import session from 'express-session';
import Knex from 'knex';
import { getLogger } from 'log4js';
import { Passport } from 'passport';
import path from 'path';

import { render } from './page';

export class App {
    constructor(config) {
        this.logger = getLogger(`[app-${config.name}]`);

        const passport = this.passport = new Passport();

        forEach(config.passport, (value, key) => {
            const Strategy = require(`passport-${key}`).Strategy;

            passport.use(new Strategy({
                ...value,
                callbackURL: `/login/callback/${key}`,
            }, (token, tokenSecret, profile, next) => {
                this.logger.debug(token, tokenSecret, profile);
                next(null, { id: profile.username });
            }));
        });

        passport.serializeUser((user, next) =>
            next(null, user && user.id)
        );
        passport.deserializeUser((id, next) =>
            next(null, id && { id })
        );

        const knex = this.knex = new Knex(config.database);
        const KnexSessionStore = ConnectSessionKnex(session);

        const app = this.app = express();

        app.use(session({
            ...config.session,
            store: new KnexSessionStore({ knex }),
        }));
        app.use(passport.initialize());
        app.use(passport.session());

        app.set('view engine', 'jade');
        app.set('views', path.join(__dirname, '../..', 'views'));

        app.get('/login/callback/:provider', (req, res, next) => {
            if (req.user) return next();
            passport.authenticate(req.params.provider, {
                successRedirect: '/',
                failureRedirect: '/login',
            })(req, res, next);
        });

        app.get('/login/:provider', (req, res, next) => {
            if (req.user) return next();
            passport.authenticate(req.params.provider)(req, res, next);
        });

        app.get('/login', (req, res, next) => {
            if (req.user) return next();

            return res.render('static', {
                title: 'Login',
                body: render('Login', {
                    providers: Object.keys(config.passport),
                }),
            });
        });

        app.get('/logout', (req, res, next) => {
            if (!req.user) return next();

            req.logout();
            return res.redirect('/');
        });

        app.use((req, res, next) => {
            if (req.user) return next();
            res.redirect('/login');
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
        result[key] = new App(value);
    });
}
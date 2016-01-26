import config, { util } from 'config';
import express from 'express';
import lodash from 'lodash';
import passports from './passport';
import { web } from './proxy';
import sessions from './session';

const Apps = lodash(config.get('apps'))
    .transform((result, appConfig, name) => {
        util.extendDeep(appConfig, config.get('default'));

        const app = result[name] = express();
        const passport = passports[name];

        app.use(sessions[name]);

        app.use(passport.initialize());
        app.use(passport.session());

        app.get('/login', ({}, res) => res.redirect('/login/twitter'));
        app.get(
            '/login/:provider',
            (req, ...args) =>
                passport.authenticate(req.params.provider)(req, ...args)
        );

        app.get(
            '/login/:provider/callback',
            (req, ...args) =>
            passport.authenticate(req.params.provider, {
                failureRedirect: `/login`,
            })(req, ...args),
            (req, res) => {
                const redirectTo = req.session.redirectTo || '/';
                req.session.redirectTo = null;
                return res.redirect(redirectTo);
            }
        );

        app.get('/logout', (req, res) => {
            req.logout();
            res.redirect('/');
        });

        app.use(web);
    })
    .value();

export const byName = (name) => Apps[name];

const Domains = lodash(Apps)
    .transform((result, app, name) => {
        result[config.get('apps').get(name).get('domain')] = app;
    })
    .value();
export const byDomain = (domain) =>  Domains[domain];
import config, { util } from 'config';
import express from 'express';
import lodash from 'lodash';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Login } from '../components/Login';
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

        app.set('view engine', 'jade');

        const domain = appConfig.get('domain');
        const onlyDomain = (handler) => (req, res, next) => {
            if (req.headers.host !== domain) return next();
            return handler(req, res, next);
        };

        const login = renderToStaticMarkup(
            <Login providers={Object.keys(appConfig.passport)} />
        );

        app.get('/login', onlyDomain((req, res) => res.render('login', {
            title: appConfig.get('name'),
            body: login,
        })));

        app.get(
            '/login/:provider',
            onlyDomain((req, res, next) => {
                if (!req.session.redirectTo) {
                    req.session.redirectTO =
                        `http://${req.headers.host}/`;
                }
                return next();
            }),
            onlyDomain((req, ...args) =>
                passport.authenticate(req.params.provider)(req, ...args)
            )
        );

        app.get(
            '/login/:provider/callback',
            onlyDomain((req, ...args) =>
                passport.authenticate(req.params.provider, {
                    failureRedirect: `/login`,
                })(req, ...args)
            ),
            onlyDomain((req, res) => {
                const redirectTo = req.session.redirectTo || '/';
                req.session.redirectTo = null;
                return res.redirect(redirectTo);
            })
        );

        app.get('/logout', onlyDomain((req, res) => {
            req.logout();
            res.redirect('/');
        }));

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
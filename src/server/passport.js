/* eslint max-params: [2, 4] */

import config from 'config';
import passport from 'passport';
import TwitterStrategy from 'passport-twitter';
import db from './db';

passport.use(new TwitterStrategy(Object.assign(
    {},
    config.get('oauth.twitter'),
    {
        callbackURL: 'http://' + config.get('name') + '/auth/twitter/callback',
    }
), (token, tokenSecret, profile, next) => {
    console.log('Authenticate: twitter:' + profile.id);
    db('users')
        .where({
            enabled: true,
            provider: 'twitter',
            oauth_id: profile.id,
        })
    .first('userid', 'name')
        .then((user) => {
            console.log(
                `Authenticated: twitter: ${profile.id} > ${JSON.stringify(user)}`
            );
            next(null, user);
        }, next);
}));

passport.serializeUser((user, next) =>
    next(null, user.userid)
);

passport.deserializeUser((id, next) =>
    db('users')
        .where({
            enabled: true,
            userid: id,
        })
    .first('userid', 'name')
    .then((user) => next(null, user), next)
);

module.exports = passport;

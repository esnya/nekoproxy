'use strict';

const passport = require('passport');
const TwitterStrategy = require('passport-twitter');

const db = require('./db');

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: 'http://' + (process.env.SERVER_NAME || 'localhost') + '/auth/twitter/callback',
},
function(token, tokenSecret, profile, next) {
    console.log('Authenticate: twitter:' + profile.id);
    db('users')
        .where({
            enabled: true,
            provider: 'twitter',
            oauth_id: profile.id,
        })
    .first('userid', 'name')
        .then(function (user) {
            console.log('Authenticated: twitter:' + profile.id + ' > ' + JSON.stringify(user));
            next(null, user);
        }, next);
}));

passport.serializeUser(function(user, next) {
    next(null, user.userid);
});

passport.deserializeUser(function(id, next) {
    db('users')
        .where({
            enabled: true,
            userid: id,
        })
    .first('userid', 'name')
        .then(user => next(null, user), next);
});

module.exports = passport;

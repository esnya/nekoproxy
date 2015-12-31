'use strict';

const passport = require('passport');
const TwitterStrategy = require('passport-twitter');

module.exports = function(connection) {
    passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: 'http://' + (process.env.SERVER_NAME || 'localhost') + '/auth/twitter/callback',
    },
    function(token, tokenSecret, profile, next) {
        console.log('Authenticate: twitter:' + profile.id);
        connection.query(
                "select userid, name from users where users.enabled and users.provider = 'twitter' and users.oauth_id = ?",
                [profile.id],
                function(error, result) {
                    console.log('Authenticated: twitter:' + profile.id + ' > ' + JSON.stringify(error || result && result[0], null, true));
                    return next(error, result && result[0]);
                });
    }));

    passport.serializeUser(function(user, next) {
        next(null, user.userid);
    });

    passport.deserializeUser(function(id, next) {
        connection.query(
                "select userid, name from users where users.enabled and users.userid = ?",
                [id],
                function(error, result) {
                    return next(error, result && result[0]);
                });
    });

    return passport;
};

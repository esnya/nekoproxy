'use strict';

const crypto = require('crypto');
const express = require('express');
const http = require('http');

let app = express();
let server = http.createServer(app);
let passport = require('./passport')(require('./db'));
let proxy = require('./proxy');

app.use(require('express-session')({
    cookie: {
        domain: process.env.SERVER_NAME,
    },
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(proxy.web);

server.on('upgrade', proxy.ws);
app.get('/auth/twitter',
        passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
        passport.authenticate('twitter', { failureRedirect: '/auth/twitter' }),
        function(req, res) {
            let redirectTo = req.session.redirectTo || '/';
            req.session.redirectTo = null;
            return res.redirect(redirectTo);
        });

server.listen(80, function() {
    console.log('Listening on *:80');
});

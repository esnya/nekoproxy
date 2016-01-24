const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const passport = require('./passport');
const proxy = require('./proxy');

app.use(require('./session'));
app.use(passport.initialize());
app.use(passport.session());

app.use(proxy.web);

server.on('upgrade', proxy.ws);
app.get('/auth/twitter',
        passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
        passport.authenticate('twitter', { failureRedirect: '/auth/twitter' }),
        (req, res) => {
            const redirectTo = req.session.redirectTo || '/';
            req.session.redirectTo = null;
            return res.redirect(redirectTo);
        });

server.listen(80, () => {
    console.log('Listening on *:80');
});

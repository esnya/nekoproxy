var crypto = require('crypto');
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: process.env.MYSQL_PORT_3306_TCP_ADDR,
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'www_users'
});

connection.connect();

var auth_digest = function(req, res, table, callback, error) {
    delete req.headers['username'];
    delete req.headers['Username'];
    delete req.headers['USERNAME'];
    delete req.headers['Remote-User'];
    delete req.headers['REDIRECT_REMOTE_USER'];
    delete req.headers['X-Forwarded-User'];

    var tables = {
        sw2: 'sw2',
        trpg: 'trpg',
        project_game: 'project_game',
        project_newworld: 'project_game',
        newworld: 'project_game',
        building: 'building',
        cornmint: 'building',
        'corn-mint': 'building',
        hg: 'hg',
        nenga: 'nenga',
        ukatama_dev: 'ukatama_dev',
        kadai: 'kadai'
    };

    var response401 = function() {
        var nonceHash = crypto.createHash('sha256');
        nonceHash.update(Math.random().toString());
        var nonce = nonceHash.digest('hex');

        if (res) {
            res.writeHeader(401, {
                'WWW-Authenticate': 'Digest realm="ukatama_dev", nonce="' + nonce + '", algorithm=MD5, qop="auth"',
                'Content-Type': 'text/html; charset=utf8'
            });
            res.end('401');
        }

        if (error) {
            error(nonce);
        }
    };

    var authValue;
    if ('Authorization' in req.headers) {
        authValue = req.headers['Authorization'];
    } else if ('authorization' in req.headers) {
        authValue = req.headers['authorization'];
    } else {
        response401();
        return;
    }

    var userid;
    var m = authValue.match(/username="(([^"]|\\")*)"/);
    if (m) userid = m[1];

    if (!table) {
        var m = authValue.match(/uri="\/?(([^"\/]|\\")*)(([^"]|\\")*)"/);
        if (m) table = m[1];
    }

    var digest;
    var m = authValue.match(/response="(([^"]|\\")*)"/);
    if (m) digest = m[1];

    var nonce;
    var m = authValue.match(/nonce="(([^"]|\\")*)"/);
    if (m) nonce = m[1];

    var nc;
    var m = authValue.match(/nc=([0-9a-fA-F]+)/);
    if (m) nc = m[1];

    var cnonce;
    var m = authValue.match(/cnonce="(([^"]|\\")*)"/);
    if (m) cnonce = m[1];

    var qop;
    var m = authValue.match(/qop="?(auth|auth-int)"?/);
    if (m) qop = m[1];

    if (!userid || !digest || !nonce || !nc || !cnonce || !qop) {
        response401();
        return;
    }

    var query, data;
    if (table in tables) {
        query = 'select users.password from ' + tables[table] + ' left join users on ' + tables[table] + '.userid = users.userid where users.enabled and ' + tables[table] + '.userid = ?';
    } else {
        query = 'select password from users where users.enabled and users.userid = ?';
    }

    connection.query(query, [userid], function(error, result) {
        if (error) {
            console.error(error);
        } else {
            var auth = false;
            if (result && result.length == 1 && callback) {
                var md5_hex = function (data) {
                    var md5 = crypto.createHash('md5');
                    md5.update(data);
                    return md5.digest('hex');
                };

                var a1 = result[0].password;
                var a2 = md5_hex(req.method + ':' + req.url);

                auth = md5_hex([a1, nonce, nc, cnonce, qop, a2].join(':')) == digest;
            }

            if (auth) {
                req.headers['Username'] = userid;
                req.headers['Remote-User'] = userid;
                req.headers['Redirect-Remote-User'] = userid;
                req.headers['X-Forwarded-User'] = userid;
                req.headers['WWW-Auth-Type'] = 'digest';
                callback(userid);
            } else {
                response401();
            }
        }
    });
};

module.exports = auth_digest;

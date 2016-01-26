var config = {
    apps: {},
    default: {},
    rules: {},
};
var ruleTable = {};

Object.keys(process.env)
    .forEach(function(key) {
        var m = key.match(/^([A-Z0-9]+)_([A-Z0-9_]+)$/);
        if (!m) return;

        var APP = m[1];
        if (APP !== 'DEFAULT' && (
            !process.env[APP + '_NAME'] || !process.env[APP + '_DOMAIN']
        )) return;
        var app = APP.toLowerCase();

        var appConfig = config.apps[app]
             || (config.apps[app] = {
                database: {
                    connection: {},
                },
                passport: {
                },
                session: {
                },
            });
        var rules = ruleTable[app] || (ruleTable[app] = {});

        var path = m[2];
        var value = process.env[key];

        var n;
        if (path.match(/^[A-Z]+$/)) {
            appConfig[path.toLowerCase()] = value;
        } else if (path.match(/^SESSION_SECRET$/)) {
            appConfig.session.secret = value;
        } else if (path === 'MYSQL_PORT_3306_TCP_ADDR') {
            appConfig.database.client = 'mysql'
            appConfig.database.connection.host = value;
        } else if (path === 'MYSQL_ROOT_PASSWORD') {
            appConfig.database.client = 'mysql'
            appConfig.database.connection.database = value;
        } else if (path === 'MYSQL_ROOT_PASSWORD') {
            appConfig.database.client = 'mysql'
            appConfig.database.connection.user = 'root';
            appConfig.database.connection.password = value;
        } else if((n = path.match(/^([A-Z0-9]+)_CONSUMER_KEY$/))) {
            var provider = n[1].toLowerCase();
            var secret = process.env[APP + '_' + n[1] + '_CONSUMER_SECRET'];
            appConfig.passport[provider] = {
                consumerKey: value,
                consumerSecret: secret,
            };
        } else if((n = path.match(/^([A-Z0-9]+)_PORT_80_TCP_ADDR$/))) {
            var route = n[1].toLowerCase();
            var port = process.env[APP + '_' + n[1] + '_PORT_80_TCP_PORT'];
            var public = process.env[APP + '_' + n[1] + '_PUBLIC'];
            rules[route] = {
                app: app,
                public: public,
                proxy: {
                    target: 'http://' + value + ':' + port, 
                }
            };
        }
    });
Object.keys(ruleTable)
    .forEach(function(app) {
        var rules = ruleTable[app];
        var appConfig = config.apps[app];

        Object.keys(rules)
            .forEach(function(rule) {
                config.rules[rule + '.' + appConfig.domain]
                    = rules[rule];
            });
    });

if (process.env.SERVE_MOCK) {
    config.mock = true;
}

exports = module.exports = config;
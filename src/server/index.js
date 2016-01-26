require('source-map-support').install();
require('./server');

const config = require('config');
if (config.get('mock')) {
    require('./mock');
}
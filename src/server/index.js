/* eslint global-require: 0 */

require('source-map-support').install();
require('./nekoproxy');

if (require('config').get('mock')) {
    require('./mock');
}
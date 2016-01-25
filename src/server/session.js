import config, { util } from 'config';
import session from 'express-session';
import lodash from 'lodash';
import stores from './session-store';

export default lodash(config.get('apps'))
    .transform((result, appConfig, name) => {
        util.extendDeep(appConfig, config.get('default'));

        result[name] = session({
            ...appConfig.get('session'),
            cookie: {
                ...appConfig.get('session').cookie,
                domain: appConfig.get('domain'),
            },
            store: stores[name],
        });
    })
    .value();
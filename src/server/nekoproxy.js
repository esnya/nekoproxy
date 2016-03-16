import config from 'config';
import {Server} from './server';
import {endpoint} from './metrics';

export const server = new Server(config);
endpoint(config.get('metrics'));

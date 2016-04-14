import config from 'config';
import {Server} from './server';
import {MetricCounter} from './metrics';

export const metrics = new MetricCounter(config);
export const server = new Server(config, metrics);

import config from 'config';
import Knex from 'knex';
 
export default Knex(config.get('database'));
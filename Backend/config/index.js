const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseConfig = require('./database');
const redisConfig = require('./redis');
const authConfig = require('./auth');
const appConfig = require('./app');
const mailConfig = require('./mail');

const config = {
  database: databaseConfig,
  redis: redisConfig,
  auth: authConfig,
  app: appConfig,
  mail: mailConfig,
  environment: appConfig.environment,
};

module.exports = config; 
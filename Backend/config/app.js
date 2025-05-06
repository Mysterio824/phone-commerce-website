require('dotenv').config();

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || 'localhost';
const environment = process.env.NODE_ENV || 'development';

const appConfig = {
  port: port,
  host: host,
  environment: environment,
  
  apiBaseUrl: process.env.API_BASE_URL || `http://${host}:${port}`,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:8080',
  
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [ environment === 'development' ? '*' : (process.env.CLIENT_URL || `http://${host}:${port}`) ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  },
};

module.exports = appConfig; 
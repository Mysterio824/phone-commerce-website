require('dotenv').config(); 

const postgresConfig = {
  host: process.env.DBHOST,
  port: parseInt(process.env.DBPORT || '5432', 10),
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  },
  ssl: process.env.DBSSL === 'true' ? { rejectUnauthorized: false } : false,
};

module.exports = {
  postgres: postgresConfig,
}; 
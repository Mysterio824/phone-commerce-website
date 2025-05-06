const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const initializeDatabase = async () => {
  const pool = new Pool({
    user: config.database.postgres.user,
    host: config.database.postgres.host,
    database: config.database.postgres.database,
    password: config.database.postgres.password,
    port: config.database.postgres.port,
    ssl: config.database.postgres.ssl,
  });

  try {
    console.log("Checking database connection...");
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    // Read the SQL initialization file
    console.log("Initializing database tables...");
    const initSqlPath = path.join(__dirname, "./initDb.sql");
    const initSql = fs.readFileSync(initSqlPath, "utf8");

    // Execute the SQL script
    await pool.query(initSql);
    console.log("Database tables initialized successfully");

    await pool.end();
    return true;
  } catch (error) {
    console.error("Database initialization error:", error.message);

    // Check if this is a "relation already exists" error
    if (error.message.includes("already exists")) {
      console.log("Tables already exist, continuing server startup");
      await pool.end();
      return true;
    }

    await pool.end();
    return false;
  }
};

module.exports = initializeDatabase;

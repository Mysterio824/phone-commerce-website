const { Pool, types } = require("pg");
const config = require("../../config");

types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

// Initialize the PostgreSQL connection pool using config
const pool = new Pool({
  user: config.database.postgres.user,
  host: config.database.postgres.host,
  database: config.database.postgres.database,
  password: config.database.postgres.password,
  port: config.database.postgres.port,
  min: config.database.postgres.pool.min,
  max: config.database.postgres.pool.max,
  idleTimeoutMillis: config.database.postgres.pool.idleTimeoutMillis,
  ssl: config.database.postgres.ssl,
});

pool.on("error", (err) => {
  console.error("Unexpected error on the database connection pool:", err);
  process.exit(-1);
});

pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully.");
    client.release();
  })
  .catch((err) => {
    console.error("FATAL ERROR: Failed to connect to the database.");
    console.error(err.stack);
    process.exit(1);
  });

const MAX_QUERY_LIMIT = 10000;

const defaultSchema = process.env.DBSCHEMA || "public";

const createDbClient = (schema = defaultSchema) => {
  const qualifyTableName = (tbName) => {
    return `${schema}.${tbName}`;
  };

  const executeQuery = async (text, values = [], client = pool) => {
    try {
      const { rows } = await client.query(text, values);
      return rows;
    } catch (err) {
      console.error(`Database query error: ${err.message}`, {
        query: text,
        values,
      });
      throw new Error(`Database operation failed: ${err.message}`);
    }
  };

  return {
    getClient: async () => {
      try {
        const client = await pool.connect();
        return client;
      } catch (err) {
        console.error("Error getting database client from pool:", err.message);
        throw err;
      }
    },

    startTransaction: async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        return client;
      } catch (err) {
        client.release();
        throw new Error("Failed to start transaction: " + err.message);
      }
    },

    commitTransaction: async (client) => {
      try {
        await client.query("COMMIT");
      } catch (err) {
        throw new Error("Failed to commit transaction: " + err.message);
      } finally {
        client.release();
      }
    },

    rollbackTransaction: async (client) => {
      try {
        await client.query("ROLLBACK");
      } catch (err) {
        throw new Error("Failed to rollback transaction: " + err.message);
      } finally {
        client.release();
      }
    },

    all: async (tbName) => {
      const text = `SELECT * FROM ${qualifyTableName(tbName)}`;
      return await executeQuery(text);
    },

    allWithLimit: async (tbName, page = 1, perPage = 10) => {
      page = parseInt(page) || 1;
      perPage = parseInt(perPage) || 10;
      if (perPage > MAX_QUERY_LIMIT) {
        console.warn(
          `Limit exceeds maximum allowed (${MAX_QUERY_LIMIT}). Setting to ${MAX_QUERY_LIMIT}.`
        );
        perPage = MAX_QUERY_LIMIT;
      }
      const offset = (page - 1) * perPage;
      const text = `
                SELECT * FROM ${qualifyTableName(tbName)}
                LIMIT $1 OFFSET $2`;
      const values = [perPage, offset];
      return await executeQuery(text, values);
    },

    some: async (tbName, idField, idValue, page = 1, perPage = Infinity) => {
      const offset = (page - 1) * perPage;
      const text = `
              SELECT * FROM ${qualifyTableName(tbName)}
              WHERE ${idField} = $1
              ${
                perPage !== Infinity ? `LIMIT ${perPage} OFFSET ${offset}` : ""
              }`;

      return await executeQuery(text, [idValue]);
    },

    one: async (tbName, idField, idValue) => {
      const text = `SELECT * FROM ${qualifyTableName(
        tbName
      )} WHERE "${idField}" = $1 LIMIT 1`;
      const rows = await executeQuery(text, [idValue]);
      return rows[0] || null;
    },

    add: async (tbName, entity, client = pool) => {
      const keys = Object.keys(entity);
      const values = Object.values(entity);
      const quotedKeys = keys.map((key) => `${key}`); // Quote keys
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const text = `
                INSERT INTO ${qualifyTableName(tbName)} (${quotedKeys.join(
        ", "
      )})
                VALUES (${placeholders})
                RETURNING *
            `;
      const rows = await executeQuery(text, values, client);
      return rows[0];
    },

    edit: async (tbName, entity, client = pool, idField = "id") => {
      const keys = Object.keys(entity);
      const idValue = entity[idField];
      if (idValue === undefined || idValue === null) {
        // Check for undefined or null
        throw new Error(
          `Missing required identifier ('${idField}') for update operation in table '${tbName}'`
        );
      }

      const filteredKeys = keys.filter((key) => key !== idField);
      if (filteredKeys.length === 0) {
        console.warn(
          `No fields to update for ${tbName} with ${idField}=${idValue}`
        );
        return await this.one(tbName, idField, idValue); // Assuming 'this' context works or use direct call
      }

      const filteredValues = filteredKeys.map((key) => entity[key]);
      const setClause = filteredKeys
        .map((key, i) => `"${key}" = $${i + 1}`)
        .join(", "); // Quote keys
      const text = `
                UPDATE ${qualifyTableName(tbName)}
                SET ${setClause}
                WHERE ${idField} = $${
        filteredKeys.length + 1
      }  /* Quote idField */
                RETURNING *
            `;
      const values = [...filteredValues, idValue];

      const rows = await executeQuery(text, values, client);
      if (rows.length === 0) {
        console.warn(
          `Update attempted on non-existent record: ${tbName} with ${idField}=${idValue}`
        );
        return null;
      }
      return rows[0];
    },

    delete: async (tbName, idField, idValue, client = pool) => {
      const text = `DELETE FROM ${qualifyTableName(
        tbName
      )} WHERE ${idField} = $1 RETURNING *`;
      const rows = await executeQuery(text, [idValue], client);
      if (rows.length === 0) {
        console.warn(
          `Delete attempted on non-existent record: ${tbName} with ${idField}=${idValue}`
        );
        return null;
      }
      return rows[0];
    },

    query: async (text, values = [], client = pool) => {
      return await executeQuery(text, values, client);
    },

    pool,
  };
};

// Export the default database client instance
module.exports = createDbClient();

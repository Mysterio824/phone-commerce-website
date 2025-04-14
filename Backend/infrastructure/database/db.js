const { Pool, types } = require('pg');
const config = require('../../config');

types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

console.log(config.database.postgres.password);

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

// Handle unexpected errors on the pool
pool.on('error', (err) => {
    console.error('Unexpected error on the database connection pool:', err);
    process.exit(-1);
});

// Check connection on startup (optional but recommended)
pool.connect()
    .then(client => {
        console.log('Database connected successfully.');
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
        console.error('FATAL ERROR: Failed to connect to the database.');
        console.error(err.stack);
        process.exit(1);
    });

const MAX_QUERY_LIMIT = 10000;

// Database client factory function
// Read schema from config or .env, prioritize config if added there
const defaultSchema = process.env.DBSCHEMA || 'public'; // Fallback to 'public' or read from .env if needed

const createDbClient = (schema = defaultSchema) => {
    const qualifyTableName = (tbName) => {
        // Avoid adding schema if table name already includes it or schema is 'public'
        if (tbName.includes('.') || schema === 'public') {
            return tbName;
        }
        // Ensure schema and table name are properly quoted if they contain special characters
        // Basic quoting example, consider a more robust solution if needed
        return `"${schema}"."${tbName}"`;
    };

    const executeQuery = async (text, values = [], client = pool) => {
        try {
            // Optional: Log queries in development
            if (config.environment === 'development') {
                 console.log('Executing Query:', text, values);
            }
            const { rows } = await client.query(text, values);
            return rows;
        } catch (err) {
            console.error(`Database query error: ${err.message}`, { query: text, values });
            // Avoid throwing raw DB errors to client layers in production
            // Consider wrapping in a custom error type
            throw new Error(`Database operation failed: ${err.message}`); // Or a more specific error
        }
    };

    return {
        getClient: async () => {
            try {
                const client = await pool.connect();
                return client; // Return the acquired client
            } catch (err) {
                console.error('Error getting database client from pool:', err.message);
                throw err; // Re-throw the error
            }
        }, // Added explicit return

        all: async (tbName) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)}`;
            return await executeQuery(text);
        },

        allWithCondition: async (tbName, idField, idValue) => {
            // Basic input validation/sanitization is recommended here
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE "${idField}" = $1`; // Quote idField
            return await executeQuery(text, [idValue]);
        },

        // Fetch all rows with a joined relationship
        allWithRelationship: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB) => {
            const text = `
                SELECT *
                FROM ${qualifyTableName(tbName)} t1
                INNER JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1."${idFieldTB}" = t2."${idFieldReferencedTB}"`; // Quote identifiers
            return await executeQuery(text);
        },

        // Fetch a specific row with additional fields from a related table
        allOneWithRelationShip: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue, additionalFields) => {
            // Sanitize or validate additionalFields to prevent injection
            const safeAdditionalFields = additionalFields.map(field => `"${field}"`); // Basic quoting
            const selectFields = safeAdditionalFields.map(field => `t2.${field} AS ${field}`).join(', ');
            const text = `
                SELECT t1.*, ${selectFields}
                FROM ${qualifyTableName(tbName)} t1
                LEFT JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1."${idFieldTB}" = t2."${idFieldReferencedTB}"
                WHERE t1."${idField}" = $1;
            `; // Quote identifiers
            return await executeQuery(text, [idValue]);
        },

        one: async (tbName, idField, idValue) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE "${idField}" = $1 LIMIT 1`; // Quote idField
            const rows = await executeQuery(text, [idValue]);
            return rows[0] || null;
        },

        // Fetch a single row with multiple conditions
        oneWithMultipleConditions: async (tbName, idFieldList, idValueList) => {
            if (idFieldList.length !== idValueList.length) {
                throw new Error('idFieldList and idValueList must have the same length');
            }

            const conditions = idFieldList
                .map((field, i) => `"${field}" = $${i + 1}`) // Quote identifiers
                .join(' AND ');
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE ${conditions} LIMIT 1`;

            const rows = await executeQuery(text, idValueList);
            return rows[0] || null;
        },

        // Fetch a single row with a joined relationship
        oneWithRelationship: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue) => {
            const text = `
                SELECT *
                FROM ${qualifyTableName(tbName)} t1
                INNER JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1."${idFieldTB}" = t2."${idFieldReferencedTB}"
                WHERE t1."${idField}" = $1`; // Quote identifiers
            const rows = await executeQuery(text, [idValue]);
            return rows[0] || null;
        },

        add: async (tbName, entity, client = pool) => {
            const keys = Object.keys(entity);
            const values = Object.values(entity);
            const quotedKeys = keys.map(key => `"${key}"`); // Quote keys
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const text = `
                INSERT INTO ${qualifyTableName(tbName)} (${quotedKeys.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;
            const rows = await executeQuery(text, values, client);
            return rows[0];
        },

        edit: async (tbName, entity, idField = 'id', client = pool) => {
            const keys = Object.keys(entity);
            const idValue = entity[idField];
            if (idValue === undefined || idValue === null) { // Check for undefined or null
                throw new Error(`Missing required identifier ('${idField}') for update operation in table '${tbName}'`);
            }

            const filteredKeys = keys.filter((key) => key !== idField);
            // Ensure there are fields to update
            if (filteredKeys.length === 0) {
                 console.warn(`No fields to update for ${tbName} with ${idField}=${idValue}`);
                 // Optionally return the original entity or fetch the current state
                 return await this.one(tbName, idField, idValue); // Assuming 'this' context works or use direct call
            }

            const filteredValues = filteredKeys.map((key) => entity[key]);
            const setClause = filteredKeys.map((key, i) => `"${key}" = $${i + 1}`).join(', '); // Quote keys
            const text = `
                UPDATE ${qualifyTableName(tbName)}
                SET ${setClause}
                WHERE "${idField}" = $${filteredKeys.length + 1}  /* Quote idField */
                RETURNING *
            `;
            const values = [...filteredValues, idValue];

            const rows = await executeQuery(text, values, client);
             if (rows.length === 0) {
                 // This means the WHERE clause didn't match any rows
                 console.warn(`Update attempted on non-existent record: ${tbName} with ${idField}=${idValue}`);
                 return null; // Or throw an error
             }
            return rows[0];
        },

        delete: async (tbName, idField, idValue, client = pool) => {
            const text = `DELETE FROM ${qualifyTableName(tbName)} WHERE "${idField}" = $1 RETURNING *`; // Quote idField
            const rows = await executeQuery(text, [idValue], client);
             if (rows.length === 0) {
                 console.warn(`Delete attempted on non-existent record: ${tbName} with ${idField}=${idValue}`);
                 return null; // Return null if nothing was deleted
             }
            return rows[0]; // Return the deleted row
        },

        query: async (text, values = [], client = pool) => {
            // Be cautious with exposing raw query execution
            return await executeQuery(text, values, client);
        },

        // Expose the pool itself if direct access is needed (use sparingly)
        pool,
    };
};

// Export the default database client instance
module.exports = createDbClient();
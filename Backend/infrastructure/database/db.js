const { Pool, types } = require('pg');
require('dotenv').config();

// Parse NUMERIC types as floats for consistency
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

// Initialize the PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DBNAME,
    password: process.env.DBPASSWORD,
    port: process.env.DBPORT,
});

// Handle unexpected errors on the pool
pool.on('error', (err) => {
    console.error('Unexpected error on the database connection:', err);
    process.exit(-1);
});

// Default maximum query limit to prevent overly large queries
const MAX_QUERY_LIMIT = 10000;

// Database client factory function
const createDbClient = (schema = process.env.DBSCHEMA) => {
    // Helper function to qualify table names with the schema
    const qualifyTableName = (tbName) => `${schema}.${tbName}`;

    // Helper function to execute a query with error handling
    const executeQuery = async (text, values = [], client = pool) => {
        try {
            const { rows } = await client.query(text, values);
            return rows;
        } catch (err) {
            console.error(`Database query error: ${err.message}`, { query: text, values });
            throw err;
        }
    };

    return {
        // Get a database client for transactions
        getClient: async () => {
            try {
                return await pool.connect();
            } catch (err) {
                console.error('Error getting database client:', err.message);
                throw err;
            }
        },

        // Fetch all rows from a table
        all: async (tbName) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)}`;
            return await executeQuery(text);
        },

        // Fetch a single row by matching fields
        one: async (tbName, idFieldList, idValueList) => {
            if (idFieldList.length !== idValueList.length) {
                throw new Error('idFieldList and idValueList must have the same length');
            }

            const conditions = idFieldList
                .map((field, i) => `${field} = $${i + 1}`)
                .join(' AND ');
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE ${conditions} LIMIT 1`;

            const rows = await executeQuery(text, idValueList);
            return rows[0] || null;
        },

        // Fetch multiple rows with conditions, limit, and offset
        some: async (tbName, idFieldList, idValueList, equationList, limit = MAX_QUERY_LIMIT, offset = 0) => {
            if (idFieldList.length !== idValueList.length || idFieldList.length !== equationList.length) {
                throw new Error('idFieldList, idValueList, and equationList must have the same length');
            }

            const conditions = idFieldList
                .map((field, i) => `${field} ${equationList[i]} $${i + 1}`)
                .join(' AND ');
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE ${conditions} LIMIT $${idFieldList.length + 1} OFFSET $${idFieldList.length + 2}`;
            const values = [...idValueList, limit, offset];

            return await executeQuery(text, values);
        },

        // Fetch multiple rows with a JOIN relationship
        someWithRelation: async (
            tbName,
            idFieldList,
            idValueList,
            equationList,
            tbName2,
            idFieldRelateList,
            idValueRelateList,
            limit = MAX_QUERY_LIMIT,
            offset = 0
        ) => {
            if (
                idFieldList.length !== idValueList.length ||
                idFieldList.length !== equationList.length ||
                idFieldRelateList.length !== idValueRelateList.length
            ) {
                throw new Error('idFieldList/idValueList and idFieldRelateList/idValueRelateList must have the same length');
            }

            const joinConditions = idFieldRelateList
                .map((field, i) => `${qualifyTableName(tbName)}.${field} = ${qualifyTableName(tbName2)}.${idValueRelateList[i]}`)
                .join(' AND ');
            const conditions = idFieldList
                .map((field, i) => `${field} ${equationList[i]} $${i + 1}`)
                .join(' AND ');
            const text = `
                SELECT * FROM ${qualifyTableName(tbName)}
                INNER JOIN ${qualifyTableName(tbName2)} ON ${joinConditions}
                WHERE ${conditions}
                LIMIT $${idFieldList.length + 1} OFFSET $${idFieldList.length + 2}
            `;
            const values = [...idValueList, limit, offset];

            return await executeQuery(text, values);
        },

        // Insert a new record
        add: async (tbName, entity, client = pool) => {
            const keys = Object.keys(entity);
            const values = Object.values(entity);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const text = `
                INSERT INTO ${qualifyTableName(tbName)} (${keys.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;
            const rows = await executeQuery(text, values, client);
            return rows[0];
        },

        // Update an existing record
        edit: async (tbName, entity, idField, client = pool) => {
            const keys = Object.keys(entity);
            const idValue = entity[idField];
            if (!idValue) {
                throw new Error(`Missing required ${idField} for update operation`);
            }

            const filteredKeys = keys.filter((key) => key !== idField);
            const filteredValues = filteredKeys.map((key) => entity[key]);
            const setClause = filteredKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
            const text = `
                UPDATE ${qualifyTableName(tbName)}
                SET ${setClause}
                WHERE ${idField} = $${filteredKeys.length + 1}
                RETURNING *
            `;
            const values = [...filteredValues, idValue];

            const rows = await executeQuery(text, values, client);
            return rows[0];
        },

        // Delete a record
        delete: async (tbName, idField, idValue, client = pool) => {
            const text = `DELETE FROM ${qualifyTableName(tbName)} WHERE ${idField} = $1 RETURNING *`;
            const rows = await executeQuery(text, [idValue], client);
            return rows[0];
        },

        // Expose the pool for advanced usage (e.g., transactions)
        pool,
    };
};

// Export the default database client with the schema from the environment
module.exports = createDbClient();
const { Pool, types } = require('pg');
require('dotenv').config();

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

const MAX_QUERY_LIMIT = 10000;

// Database client factory function
const createDbClient = (schema = process.env.DBSCHEMA) => {
    const qualifyTableName = (tbName) => `${schema}.${tbName}`;

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
        getClient: async () => {
            try {
                return await pool.connect();
            } catch (err) {
                console.error('Error getting database client:', err.message);
                throw err;
            }
        },

        all: async (tbName) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)}`;
            return await executeQuery(text);
        },

        allWithCondition: async (tbName, idField, idValue) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE ${idField} = $1`;
            return await executeQuery(text, [idValue]);
        },

        // Fetch all rows with a joined relationship
        allWithRelationship: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB) => {
            const text = `
                SELECT * 
                FROM ${qualifyTableName(tbName)} t1
                INNER JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1.${idFieldTB} = t2.${idFieldReferencedTB}`;
            return await executeQuery(text);
        },

        // Fetch a specific row with additional fields from a related table
        allOneWithRelationShip: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue, additionalFields) => {
            const selectFields = additionalFields.map(field => `t2.${field} AS ${field}`).join(', ');
            const text = `
                SELECT t1.*, ${selectFields}
                FROM ${qualifyTableName(tbName)} t1
                LEFT JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1.${idFieldTB} = t2.${idFieldReferencedTB}
                WHERE t1.${idField} = $1;
            `;
            return await executeQuery(text, [idValue]);
        },

        one: async (tbName, idField, idValue) => {
            const text = `SELECT * FROM ${qualifyTableName(tbName)} WHERE ${idField} = $1 LIMIT 1`;
            const rows = await executeQuery(text, [idValue]);
            return rows[0] || null;
        },

        // Fetch a single row with multiple conditions
        oneWithMultipleConditions: async (tbName, idFieldList, idValueList) => {
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

        // Fetch a single row with a joined relationship
        oneWithRelationship: async (tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue) => {
            const text = `
                SELECT * 
                FROM ${qualifyTableName(tbName)} t1
                INNER JOIN ${qualifyTableName(referencedTBName)} t2
                ON t1.${idFieldTB} = t2.${idFieldReferencedTB}
                WHERE t1.${idField} = $1`;
            const rows = await executeQuery(text, [idValue]);
            return rows[0] || null;
        },

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

        edit: async (tbName, entity, idField = 'id', client = pool) => {
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

        delete: async (tbName, idField, idValue, client = pool) => {
            const text = `DELETE FROM ${qualifyTableName(tbName)} WHERE ${idField} = $1 RETURNING *`;
            const rows = await executeQuery(text, [idValue], client);
            return rows[0];
        },

        query: async (text, values = [], client = pool) => {
            return await executeQuery(text, values, client);
        },

        pool,
    };
};

// Export the default database client with the schema from the environment
module.exports = createDbClient();
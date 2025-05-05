const db = require('../db');
const tbName = 'Brands';
const idFieldTB = 'id';

const brandModel = {
    all: async () => {
        return await db.all(tbName);
    },
    some: async (idFieldTB, idValue, page, perPage) => {
        return await db.some(tbName, idFieldTB, idValue, page, perPage);
    },
    one: async idValue => {
        return await db.one(tbName, idFieldTB, idValue);
    },
    add: async entity => {
        return await db.add(tbName, entity);
    },
    edit: async entity => {
        return await db.edit(tbName, entity);
    },
    delete: async idValue => {
        return await db.delete(tbName, idFieldTB, idValue);
    }
};

module.exports = brandModel;
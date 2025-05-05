const db = require('../db');
const tbName = 'ProductReviews';
const idFieldTB = 'id';

const reviewModel = {
    all: async () => {
        return await db.all(tbName);
    },
    some: async (idFieldTB, idValue, page, perPage) => {
        return await db.some(tbName, idFieldTB, idValue, page, perPage);
    },
    one: async idValue => {
        return await db.one(tbName, idFieldTB, idValue);
    },
    add: async review => {
        return await db.add(tbName, review);
    },
    edit: async review => {
        return await db.edit(tbName, review);
    },
    delete: async (idField, idValue) => {
        return await db.delete(tbName, idField, idValue);
    }
};

module.exports = reviewModel;
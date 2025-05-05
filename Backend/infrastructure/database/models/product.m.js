const db = require('../db');
const tbName = 'Products';
const idFieldTB = 'id';

const productModel = {
    all: async () => {
        const products = await db.all(tbName);
        return products;
    },
    some: async (idField, idValue) => {
        const products = await db.some(tbName, idField, idValue);
        return products;
    },
    one: async (idField, idValue) => {
        const product = await db.one(tbName, idField, idValue);
        return product;
    },
    add: async product => {
        const p = await db.add(tbName, product);
        return p;
    },
    edit: async product => {
        const p = await db.edit(tbName, product);
        return p;
    },
    delete: async idValue => {
        const rs = await db.delete(tbName, idFieldTB, idValue);
        return rs;
    }
};

module.exports = productModel;
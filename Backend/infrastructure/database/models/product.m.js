const db = require('../db');
const tbName = 'products';
const referencedTBName = 'categories';
const idFieldTB = 'id';
const idFieldReferencedTB = 'category_id';

const productModel = {
    all: async () => {
        const products = await db.all(tbName);
        return products;
    },
    allWithCondition: async (idField, idValue) => {
        const products = await db.allWithCondition(tbName, idField, idValue);
        return products;
    },
    allWithCategoryInfo: async () => {
        const products = await db.allWithRelationship(tbName, referencedTBName, idFieldTB, idFieldReferencedTB);
        return products;
    },
    one: async (idField, idValue) => {
        const product = await db.one(tbName, idField, idValue);
        return product;
    },
    oneWithCategoryInfo: async (idField, idValue) => {
        const product = await db.oneWithRelationship(tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue);
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
    delete: async (idValue) => {
        const rs = await db.delete(tbName, idFieldTB, idValue);
        return rs;
    }
};

module.exports = productModel;
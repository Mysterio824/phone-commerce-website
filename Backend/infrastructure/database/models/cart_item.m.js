const db = require('../db');
const tbName = 'cart_items';
const referencedTBName = 'products';
const idFieldTB = 'product_id';
const idFieldReferencedTB = 'id';

const cartItemModel= {
    all: async () => {
        return await db.all(tbName);
    },
    allWithCondition: async (idField, idValue) => {
        return await db.allWithCondition(tbName, idField, idValue);
    },
    allWithProductInfo: async () => {
        return await db.allWithRelationship(tbName, referencedTBName, idFieldTB, idFieldReferencedTB);
    },
    allOneWithProductInfo: async (idField, idValue) => {
        return await db.allWithRelationship(tbName, referencedTBName, idFieldTB, idFieldReferencedTB);
    },
    one: async (idField, idValue) => {
        return await db.one(tbName, idField, idValue);
    },
    oneWithProductInfo: async (idField, idValue) => {
        return await db.oneWithRelationship(tbName, referencedTBName, idFieldTB, idFieldReferencedTB, idField, idValue);
    },
    add: async (cart_item) => {
        return await db.add(tbName, cart_item);
    },
    edit: async (cart_item) => {
        return await db.edit(tbName, cart_item);
    },
    delete: async (idField, idValue) => {
        return await db.delete(tbName, idField, idValue);
    },
};

module.exports = cartItemModel;
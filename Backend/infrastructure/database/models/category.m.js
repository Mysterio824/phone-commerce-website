const db = require('../db');
const tbName = 'categories';

const categoryModel= {
    all: async () => {
        const categories = await db.all(tbName);
        return categories;
    },
    allLowest: async () => {
        const categories = await db.all(tbName);
        return categories.filter(item => item.parent != null);
    },
    one: async (idField, idValue) => {
        const category = await db.one(tbName, idField, idValue);
        return category;
    },
    add: async category => {
        const c = await db.add(tbName, category);
        return c;
    },
    edit: async category => {
        const c = await db.edit(tbName, category);
        return c;
    },
    delete: async (idField, idValue) => {
        const rs = await db.delete(tbName, idField, idValue);
        return rs;
    },
};

module.exports = categoryModel;
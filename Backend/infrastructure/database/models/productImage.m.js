const db = require('../db');
const tbName = 'ProductImages';
const idFieldTB = 'id';
const idFieldTB2 = 'productId';

const imageModel = {
    all: async () => {
        return await db.all(tbName);
    },
    some: async idValue => {
        const res = await db.some(tbName, idFieldTB2, idValue);
        const imageUrls = res.map(item => item.imageurl);
        return imageUrls;
    },
    one: async idValue => {
        return await db.one(tbName, idFieldTB, idValue);
    },
    add: async image => {
        return await db.add(tbName, image);
    },
    edit: async image => {
        return await db.edit(tbName, image);
    },
    delete: async idValue => {
        return await db.delete(tbName, idFieldTB, idValue);
    }
};

module.exports = imageModel;
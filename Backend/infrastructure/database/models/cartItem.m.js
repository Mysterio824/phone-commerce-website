const db = require("../db");
const tbName = "CartItems";
const idFieldTB = "id";
const idFieldTB2 = "cartId";

const cartItemModel = {
  all: async (uid) => {
    return await db.some(tbName, idFieldTB2, uid);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  some: async (uid, page, perPage) => {
    return await db.some(tbName, idFieldTB2, uid, page, perPage);
  },
  add: async (item) => {
    return await db.add(tbName, item);
  },
  edit: async (item) => {
    return await db.edit(tbName, item, idFieldTB);
  },
  delete: async (idValue, client) => {
    return await db.delete(tbName, idFieldTB, idValue, client);
  },
};

module.exports = cartItemModel;

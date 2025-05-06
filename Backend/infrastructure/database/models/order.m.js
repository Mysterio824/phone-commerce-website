const db = require("../db");
const tbName = "Orders";
const idFieldTB = "id";
const idFieldTB2 = "userid";

const orderModel = {
  all: async () => {
    return await db.all(tbName);
  },
  some: async (userId, page, perPage) => {
    return await db.some(tbName, idFieldTB2, userId, page, perPage);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  add: async (order, client) => {
    return await db.add(tbName, order, client);
  },
  edit: async (order, client) => {
    return await db.edit(tbName, order, client);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
};

module.exports = orderModel; 
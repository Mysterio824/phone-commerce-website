const db = require("../db");
const tbName = "OrderAddresses";
const idFieldTB = "id";
const idFieldTB2 = "userid";

const orderAddressModel = {
  all: async () => {
    return await db.all(tbName);
  },
  some: async (userId) => {
    return await db.some(tbName, idFieldTB2, userId);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  add: async (address, client) => {
    return await db.add(tbName, address, client);
  },
  edit: async (address) => {
    return await db.edit(tbName, address);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
};

module.exports = orderAddressModel; 
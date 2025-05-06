const db = require("../db");
const tbName = "ProductVariants";
const idFieldTB = "id";
const idFieldTB2 = "productId";

const variantModel = {
  all: async (productId) => {
    return await db.some(tbName, idFieldTB2, productId);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  add: async (entity) => {
    return await db.add(tbName, entity);
  },
  edit: async (entity) => {
    return await db.edit(tbName, entity);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
};

module.exports = variantModel;

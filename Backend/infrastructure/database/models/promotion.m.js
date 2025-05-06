const db = require("../db");
const tbName = "Promotions";
const idFieldTB = "id";

const promotionModel = {
  all: async () => {
    return await db.all(tbName);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  add: async (promotion) => {
    return await db.add(tbName, promotion);
  },
  edit: async (promotion) => {
    return await db.edit(tbName, promotion);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
};

module.exports = promotionModel;

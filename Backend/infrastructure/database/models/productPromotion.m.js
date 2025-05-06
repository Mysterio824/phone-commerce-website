const db = require("../db");
const tbName = "ProductPromotions";
const qualifyTableName = "public.ProductPromotions";
const idFieldTB = "id";
const idFieldTB2 = "productid";
const idFieldTB3 = "promotionid";

const productPromotionModel = {
  all: async () => {
    return await db.all(tbName);
  },

  one: async (productId, promotionId) => {
    return await db.query(
      `SELECT * FROM ${qualifyTableName} WHERE ${idFieldTB2} = $1 AND ${idFieldTB3} = $2`,
      [productId, promotionId]
    );
  },

  getByProductId: async (productId) => {
    return await db.query(
      `SELECT * FROM ${qualifyTableName} WHERE ${idFieldTB2} = $1`,
      [productId]
    );
  },

  getByPromotionId: async (promotionId) => {
    return await db.query(
      `SELECT * FROM ${qualifyTableName} WHERE ${idFieldTB3} = $1`,
      [promotionId]
    );
  },

  add: async (association) => {
    return await db.add(tbName, association);
  },

  remove: async (productId, promotionId) => {
    return await db.query(
      `DELETE FROM ${qualifyTableName} WHERE ${idFieldTB2} = $1 AND ${idFieldTB3} = $2`,
      [productId, promotionId]
    );
  },

  removeByProductId: async (productId) => {
    return await db.query(
      `DELETE FROM ${qualifyTableName} WHERE ${idFieldTB2} = $1`,
      [productId]
    );
  },

  removeByPromotionId: async (promotionId) => {
    return await db.query(
      `DELETE FROM ${qualifyTableName} WHERE ${idFieldTB3} = $1`,
      [promotionId]
    );
  },
};

module.exports = productPromotionModel;

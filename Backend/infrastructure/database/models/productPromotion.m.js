const db = require("../db");
const tbName = "ProductPromotions";

const productPromotionModel = {
  /**
   * Get all product-promotion associations
   */
  all: async () => {
    return await db.all(tbName);
  },

  /**
   * Get a specific product-promotion association
   */
  one: async (productId, promotionId) => {
    return await db.query(
      `SELECT * FROM ${tbName} WHERE productId = ? AND promotionId = ?`,
      [productId, promotionId]
    );
  },

  /**
   * Get all promotions for a product
   */
  getByProductId: async (productId) => {
    return await db.query(`SELECT * FROM ${tbName} WHERE productId = ?`, [
      productId,
    ]);
  },

  /**
   * Get all products for a promotion
   */
  getByPromotionId: async (promotionId) => {
    return await db.query(`SELECT * FROM ${tbName} WHERE promotionId = ?`, [
      promotionId,
    ]);
  },

  /**
   * Add a product-promotion association
   */
  add: async (association) => {
    return await db.add(tbName, association);
  },

  /**
   * Remove a product-promotion association
   */
  remove: async (productId, promotionId) => {
    return await db.query(
      `DELETE FROM ${tbName} WHERE productId = ? AND promotionId = ?`,
      [productId, promotionId]
    );
  },

  /**
   * Remove all associations for a product
   */
  removeByProductId: async (productId) => {
    return await db.query(`DELETE FROM ${tbName} WHERE productId = ?`, [
      productId,
    ]);
  },

  /**
   * Remove all associations for a promotion
   */
  removeByPromotionId: async (promotionId) => {
    return await db.query(`DELETE FROM ${tbName} WHERE promotionId = ?`, [
      promotionId,
    ]);
  },
};

module.exports = productPromotionModel;

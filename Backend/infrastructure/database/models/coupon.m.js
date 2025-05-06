const db = require("../db");
const tbName = "Coupons";
const idFieldTB = "id";
const codeFieldTB = "code";

const couponModel = {
  all: async () => {
    return await db.all(tbName);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  getByCode: async (code) => {
    return await db.one(tbName, codeFieldTB, code);
  },
  add: async (coupon) => {
    return await db.add(tbName, coupon);
  },
  edit: async (coupon) => {
    return await db.edit(tbName, coupon);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
  incrementUses: async (id) => {
    const coupon = await db.one(tbName, idFieldTB, id);
    if (coupon) {
      coupon.usescount = (coupon.usescount || 0) + 1;
      return await db.edit(tbName, coupon);
    }
    return null;
  }
};

module.exports = couponModel; 
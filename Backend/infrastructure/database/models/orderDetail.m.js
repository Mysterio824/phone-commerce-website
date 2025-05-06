const db = require("../db");
const tbName = "OrderDetails";
const idFieldTB = "id";
const idFieldTB2 = "orderid";

const orderDetailModel = {
  all: async () => {
    return await db.all(tbName);
  },
  some: async (orderId) => {
    return await db.some(tbName, idFieldTB2, orderId);
  },
  one: async (idValue) => {
    return await db.one(tbName, idFieldTB, idValue);
  },
  add: async (orderDetail, client) => {
    return await db.add(tbName, orderDetail, client);
  },
  delete: async (idValue) => {
    return await db.delete(tbName, idFieldTB, idValue);
  },
};

module.exports = orderDetailModel; 
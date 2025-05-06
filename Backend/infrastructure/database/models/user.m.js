const db = require("../db");
const tbName = "Users";
const idFieldTB = "uid";
const ROLES = require("../../../application/enums/roles");

const userModel = {
  some: async (page, perPage) => {
    const users = await db.allWithLimit(tbName, page, perPage);
    return users;
  },
  one: async (idField, idValue) => {
    const user = await db.one(tbName, idField, idValue);
    return user;
  },
  add: async (user) => {
    if (!user.role) {
      user.role = ROLES.USER;
    }
    return await db.add(tbName, user);
  },
  edit: async (user) => {
    const u = await db.edit(tbName, user);
    return u;
  },
  delete: async (idValue) => {
    const rs = await db.delete(tbName, idFieldTB, idValue);
    return rs;
  },
};

module.exports = userModel;

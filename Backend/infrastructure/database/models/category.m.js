const db = require("../db");
const tbName = "Categories";
const idFieldTB = "id";
const idFieldTBParent = "parent";

const categoryModel = {
  all: async () => {
    const categories = await db.all(tbName);
    return categories;
  },
  some: async (idValue) => {
    const categories = await db.some(tbName, idFieldTBParent, idValue);
    return categories;
  },
  one: async (idValue) => {
    const category = await db.one(tbName, idFieldTB, idValue);
    return category;
  },
  add: async (category) => {
    const c = await db.add(tbName, category);
    return c;
  },
  edit: async (category) => {
    const c = await db.edit(tbName, category);
    return c;
  },
  delete: async (idValue) => {
    const rs = await db.delete(tbName, idFieldTB, idValue);
    return rs;
  },
};

module.exports = categoryModel;

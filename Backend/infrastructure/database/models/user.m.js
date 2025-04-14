const db = require('../db');
const tbName = 'users';
const ROLES = require('../../../application/enums/roles');

const userModel = {
    async one(fields, values) {
        return await db.one('users', fields, values);
    },

    async add(user) {
        if (!user.role) {
            user.role = ROLES.USER;
        }
        return await db.add(tbName, user);
    },
};

module.exports = userModel;
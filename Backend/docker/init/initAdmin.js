const bcrypt = require('bcrypt');
const userModel = require('../../infrastructure/database/models/user.m');
const ROLES = require('../../application/enums/roles');
const { hashPassword } = require('../../utils/hashUtils')

async function createAdminUser() {
    try {
        const adminUser = {
            email: 'admin@example.com',
            password: await hashPassword('Admin@123'),
            username: 'Admin',
            role: ROLES.ADMIN
        };

        const existAdmin = await userModel.one("username", adminUser.username);
        if(existAdmin){
            console.log('Admin user created successfully');
            return;
        }

        await userModel.add(adminUser);
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

module.exports = createAdminUser(); 
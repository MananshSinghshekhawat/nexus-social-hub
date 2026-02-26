const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const mongoose = require('mongoose');
const User = require('./server/models/User');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';

async function seedAdmin() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB at', URI);

        const adminEmail = 'nexuslogic@gmail.com';
        const adminUsername = 'nexuslogic';
        const adminPassword = 'nexuslogic@123';

        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log('Admin user already exists. Updating role to admin...');
            admin.role = 'admin';
            await admin.save();
        } else {
            console.log('Creating new admin user: nexuslogic...');
            admin = new User({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                display_name: 'Nexus Logic Admin',
                role: 'admin'
            });
            await admin.save();
        }

        console.log('Successfully seeded admin user: nexuslogic');
    } catch (err) {
        console.error('Failed to seed admin user:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();

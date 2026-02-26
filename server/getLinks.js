const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

async function getResetLinks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ resetPasswordToken: { $exists: true } });

        if (users.length === 0) {
            console.log("No valid password reset tokens found in the database. Did you request one?");
        } else {
            console.log("Found password reset links:");
            users.forEach(user => {
                if (user.resetPasswordExpires > Date.now()) {
                    console.log(`Email: ${user.email}`);
                    console.log(`Link: http://localhost:8080/reset-password/${user.resetPasswordToken}`);
                    console.log('------------------------------------------------');
                } else {
                    console.log(`Email: ${user.email} (EXPIRED)`);
                }
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

getResetLinks();

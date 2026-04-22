/**
 * Script to promote a user to admin role
 * Usage: node scripts/promote-user.js <email>
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address.');
    process.exit(1);
}

async function promote() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            console.error(`❌ User with email ${email} not found.`);
        } else {
            console.log(`🚀 Successfully promoted ${user.email} (Clerk ID: ${user.clerkId}) to ADMIN!`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

promote();

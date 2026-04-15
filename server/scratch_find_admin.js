const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const WorkspaceMember = require('./models/WorkspaceMember');

async function findAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check for workspace members with admin/owner roles
        const admins = await WorkspaceMember.find({ role: { $in: ['admin', 'owner'] } });
        
        console.log('\n--- Workspace Admins/Owners ---');
        if (admins.length === 0) {
            console.log('No workspace admins found.');
        } else {
            admins.forEach(admin => {
                console.log(`User ID: ${admin.userId}, Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
            });
        }

        // Check all users just in case
        const allUsers = await User.find({});
        console.log('\n--- All Registered Users ---');
        allUsers.forEach(user => {
            console.log(`Clerk ID: ${user.clerkId}, Name: ${user.name}, Email: ${user.email}, Tier: ${user.subscription.tier}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

findAdmins();

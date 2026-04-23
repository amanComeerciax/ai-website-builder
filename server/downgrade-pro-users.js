const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function downgradeProUsers() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Searching for Pro users...');
        const proUsers = await User.find({ 'subscription.tier': 'pro' });
        console.log(`Found ${proUsers.length} Pro users.`);

        if (proUsers.length === 0) {
            console.log('No Pro users to downgrade.');
            return;
        }

        const result = await User.updateMany(
            { 'subscription.tier': 'pro' },
            { 
                $set: { 
                    'subscription.tier': 'free',
                    'subscription.status': 'inactive' 
                } 
            }
        );

        console.log(`Success! ${result.modifiedCount} users have been downgraded to Free tier.`);
    } catch (err) {
        console.error('Error during downgrade:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

downgradeProUsers();

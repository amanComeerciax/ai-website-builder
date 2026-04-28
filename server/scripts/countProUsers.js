require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function countProUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const proCount = await User.countDocuments({ 'subscription.tier': 'pro' });
        const basicCount = await User.countDocuments({ 'subscription.tier': 'free' });
        const allCount = await User.countDocuments({});
        console.log('--- USER STATS ---');
        console.log('Pro Members:', proCount);
        console.log('Free Members:', basicCount);
        console.log('Total Users:', allCount);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

countProUsers();

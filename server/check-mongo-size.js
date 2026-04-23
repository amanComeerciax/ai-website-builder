const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoSize() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');

        const db = mongoose.connection.db;
        
        // Get DB stats
        const stats = await db.command({ dbStats: 1 });
        const sizeInMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
        const storageInMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
        const indexInMB = (stats.indexSize / (1024 * 1024)).toFixed(2);

        console.log('--- Database Stats ---');
        console.log(`Data Size: ${sizeInMB} MB`);
        console.log(`Storage Size: ${storageInMB} MB`);
        console.log(`Index Size: ${indexInMB} MB`);
        console.log(`Total Collections: ${stats.collections}`);
        console.log('----------------------\n');

        // Check individual collections
        console.log('--- Top Collections by Size ---');
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const colStats = await db.command({ collStats: col.name });
            const colSizeMB = (colStats.size / (1024 * 1024)).toFixed(2);
            console.log(`${col.name}: ${colSizeMB} MB`);
        }
        console.log('------------------------------');

    } catch (err) {
        console.error('Error checking MongoDB size:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkMongoSize();

const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoSize() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');

        const db = mongoose.connection.db;
        const admin = db.admin();
        const { databases } = await admin.listDatabases();
        
        let totalStorageMB = 0;
        console.log('--- Cluster Databases ---');
        for (const d of databases) {
            const dSizeMB = (d.sizeOnDisk / (1024 * 1024)).toFixed(2);
            totalStorageMB += parseFloat(dSizeMB);
            console.log(`- ${d.name}: ${dSizeMB} MB`);
        }
        console.log(`\nTOTAL CLUSTER USAGE: ${totalStorageMB.toFixed(2)} MB / 512 MB`);
        console.log('-------------------------\n');

        if (totalStorageMB > 450) {
            console.log('⚠️ WARNING: Your cluster is almost FULL!');
        }

        // Check current DB collections
        console.log(`--- Collections in ${db.databaseName} ---`);
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

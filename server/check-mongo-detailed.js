const mongoose = require('mongoose');
require('dotenv').config();

async function checkDetailedMongoSize() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');

        const db = mongoose.connection.db;
        const admin = db.admin();
        const { databases } = await admin.listDatabases();
        
        let totalDataMB = 0;
        let totalStorageMB = 0;

        console.log('--- Detailed Cluster Usage ---');
        console.log(`${'Database'.padEnd(25)} | ${'Data Size'.padEnd(12)} | ${'Storage Size'}`);
        console.log('-'.repeat(60));

        for (const d of databases) {
            if (d.name === 'local' || d.name === 'admin') continue;
            
            const targetDb = mongoose.connection.client.db(d.name);
            const stats = await targetDb.command({ dbStats: 1 });
            
            const dataMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
            const storageMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
            
            totalDataMB += parseFloat(dataMB);
            totalStorageMB += parseFloat(storageMB);
            
            console.log(`${d.name.padEnd(25)} | ${dataMB.padEnd(12)} MB | ${storageMB} MB`);
        }
        
        console.log('-'.repeat(60));
        console.log(`TOTAL UNCOMPRESSED DATA: ${totalDataMB.toFixed(2)} MB`);
        console.log(`TOTAL STORAGE USED:      ${totalStorageMB.toFixed(2)} MB / 512 MB`);
        console.log('------------------------------\n');

        if (totalStorageMB > 400 || totalDataMB > 500) {
            console.log('⚠️ WARNING: You are hitting MongoDB Atlas limits!');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkDetailedMongoSize();

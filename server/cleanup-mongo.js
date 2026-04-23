const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupMongo() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');

        const db = mongoose.connection.db;
        const admin = db.admin();

        // Databases to DROP (not needed for ai-website-builder)
        const toDelete = ['sample_mflix', 'google-maps-scraper', 'test', 'mytube', 'mytube_db'];

        for (const dbName of toDelete) {
            try {
                const targetDb = mongoose.connection.client.db(dbName);
                await targetDb.dropDatabase();
                console.log(`✅ Dropped database: ${dbName}`);
            } catch (err) {
                console.error(`❌ Failed to drop ${dbName}:`, err.message);
            }
        }

        // Verify new sizes
        console.log('\n--- Updated Cluster Usage ---');
        const { databases } = await admin.listDatabases();
        let total = 0;
        for (const d of databases) {
            if (d.name === 'local' || d.name === 'admin') continue;
            const mb = (d.sizeOnDisk / (1024 * 1024)).toFixed(2);
            total += parseFloat(mb);
            console.log(`- ${d.name}: ${mb} MB`);
        }
        console.log(`\nTOTAL (excluding local/admin): ${total.toFixed(2)} MB / 512 MB`);
        console.log('-----------------------------');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanupMongo();

/**
 * MongoDB Migration Script
 * Copies all data from 'test' database to 'ai_website_builder' database
 * 
 * Usage: node scripts/migrate-db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../server/.env') });
// Fallback: also try the current directory's .env
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
if (!URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

// Strip the database name from URI to connect at cluster level
const clusterUri = URI.replace(/\/[^/]+\?/, '/?').replace(/\/[^/]+$/, '');

const SOURCE_DB = 'test';
const TARGET_DB = 'ai_website_builder';
const COLLECTIONS = ['projects', 'messages', 'folders', 'versions', 'users', 'templates'];

async function migrate() {
    console.log('\n🚀 Starting MongoDB Migration');
    console.log(`   From: ${SOURCE_DB}`);
    console.log(`   To:   ${TARGET_DB}`);
    console.log(`   Collections: ${COLLECTIONS.join(', ')}\n`);

    const client = new MongoClient(URI.replace(/\/[^/?]+(\?.*)$/, '/$1'));
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas\n');

        // Use admin db to access multiple databases
        const sourceDb = client.db(SOURCE_DB);
        const targetDb = client.db(TARGET_DB);

        let totalMigrated = 0;

        for (const collectionName of COLLECTIONS) {
            try {
                const sourceColl = sourceDb.collection(collectionName);
                const targetColl = targetDb.collection(collectionName);

                // Count docs in source
                const sourceCount = await sourceColl.countDocuments();
                
                if (sourceCount === 0) {
                    console.log(`⏭  ${collectionName}: 0 documents — skipping`);
                    continue;
                }

                // Check how many already exist in target
                const targetCount = await targetColl.countDocuments();
                if (targetCount > 0) {
                    console.log(`⚠️  ${collectionName}: target already has ${targetCount} docs — skipping to avoid duplicates`);
                    continue;
                }

                // Fetch all docs from source
                const docs = await sourceColl.find({}).toArray();
                
                // Insert into target
                const result = await targetColl.insertMany(docs);
                totalMigrated += result.insertedCount;
                
                console.log(`✅ ${collectionName}: ${result.insertedCount}/${sourceCount} documents migrated`);
                
            } catch (err) {
                console.error(`❌ ${collectionName}: ${err.message}`);
            }
        }

        console.log(`\n🎉 Migration complete! ${totalMigrated} total documents copied.`);
        console.log(`\n📌 Next step: Restart your backend server to use the new database.\n`);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

migrate();

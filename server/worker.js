require('dotenv').config();
const { connectDB } = require('./config/db');

/**
 * Standalone Worker Entry Point
 * 
 * This file is used on Render/Railway to run the BullMQ worker
 * in a separate process from the main Express API.
 */
async function startWorker() {
    console.log('⚙️  Starting AI Generation Worker...');
    
    try {
        // 1. Connect to MongoDB
        await connectDB();
        console.log('📦 Worker connected to Database successfully.');
        
        // 2. Initialize the AI Worker
        // Requiring the file executes the 'new Worker()' constructor.
        require('./workers/aiWorker');
        
        console.log('🚀 AI worker is now active and listening for jobs in "AI_Generation_Queue".');
        
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('👋 Worker shutting down...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start worker process:', error.message);
        process.exit(1);
    }
}

startWorker();

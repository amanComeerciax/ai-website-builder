const archiver = require('archiver');
const fs = require('fs');

/**
 * Creates a Zip buffer from the virtual file tree.
 */
const createZipBuffer = async (fileTree) => {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        const buffers = [];

        archive.on('data', data => buffers.push(data));
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', err => reject(err));

        for (const [filePath, fileData] of Object.entries(fileTree)) {
            const contentStr = typeof fileData === 'string' ? fileData : (fileData.content || '');
            if (contentStr) {
                archive.append(contentStr, { name: filePath });
            }
        }

        archive.finalize();
    });
};

/**
 * Deploys a project's file tree to Netlify Drop API
 * @param {string} netlifySiteId - Existing Netlify Site ID (null if first deploy)
 * @param {object} fileTree - The virtual file tree e.g. { "index.html": { content: "..." } }
 * @returns {object} { siteId: string, url: string }
 */
const deployProject = async (netlifySiteId, fileTree) => {
    const NETLIFY_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;
    
    // Fallback if token is missing (To test locally without token, will throw error)
    if (!NETLIFY_TOKEN) {
        throw new Error("NETLIFY_ACCESS_TOKEN is missing in the backend .env file");
    }

    if (!fileTree || Object.keys(fileTree).length === 0) {
        throw new Error("No files to deploy. Project file tree is empty.");
    }

    try {
        console.log(`[DeployService] Zipping file tree...`);
        const zipBuffer = await createZipBuffer(fileTree);

        let endpointUrl = 'https://api.netlify.com/api/v1/sites';
        
        // If site exists, deploy *to* that site. Otherwise create a new site.
        if (netlifySiteId) {
            endpointUrl = `https://api.netlify.com/api/v1/sites/${netlifySiteId}/deploys`;
        }

        console.log(`[DeployService] Uploading zip to Netlify API...`);
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NETLIFY_TOKEN}`,
                'Content-Type': 'application/zip',
            },
            body: zipBuffer
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[DeployService] Netlify API Error:", data);
            throw new Error(data.message || `Netlify deploy failed with status: ${response.status}`);
        }

        console.log(`[DeployService] ✅ Netlify deploy successful: ${data.url || data.deploy_url}`);

        // If it's a new site creation, Netlify returns '.id' as siteId and '.url'
        // If it's a deploy update, Netlify returns '.site_id' and '.url'
        const siteId = data.id || data.site_id;
        const publicUrl = data.url;

        return { siteId, publicUrl };

    } catch (error) {
        console.error(`[DeployService] ❌ Failed to deploy to Netlify:`, error.message);
        throw error;
    }
};

module.exports = { deployProject };

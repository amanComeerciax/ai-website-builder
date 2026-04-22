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
    // Collect all Netlify tokens from environment variables
    const tokens = [];
    if (process.env.NETLIFY_ACCESS_TOKEN) tokens.push(process.env.NETLIFY_ACCESS_TOKEN);
    
    // Add any numbered fallbacks (e.g., NETLIFY_ACCESS_TOKEN_2, NETLIFY_ACCESS_TOKEN_3)
    let i = 2;
    while (process.env[`NETLIFY_ACCESS_TOKEN_${i}`]) {
        tokens.push(process.env[`NETLIFY_ACCESS_TOKEN_${i}`]);
        i++;
    }

    if (tokens.length === 0) {
        throw new Error("NETLIFY_ACCESS_TOKEN is missing in the backend .env file");
    }

    if (!fileTree || Object.keys(fileTree).length === 0) {
        throw new Error("No files to deploy. Project file tree is empty.");
    }

    console.log(`[DeployService] Zipping file tree...`);
    const zipBuffer = await createZipBuffer(fileTree);

    let lastError = null;

    // Try each token in order
    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
        const currentToken = tokens[tokenIndex];
        const isLastToken = tokenIndex === tokens.length - 1;
        
        try {
            let endpointUrl = 'https://api.netlify.com/api/v1/sites';
            
            // If site exists, deploy *to* that site. Otherwise create a new site.
            if (netlifySiteId) {
                endpointUrl = `https://api.netlify.com/api/v1/sites/${netlifySiteId}/deploys`;
            }

            console.log(`[DeployService] Uploading zip to Netlify API (using token ${tokenIndex + 1}/${tokens.length})...`);
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/zip',
                },
                body: zipBuffer
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Netlify deploy failed with status: ${response.status}`;
                console.error(`[DeployService] Netlify API Error (Token ${tokenIndex + 1}):`, data);

                // If this is a usage limit error and we have more tokens, try the next one
                const isUsageLimit = errorMessage.toLowerCase().includes("usage limit") || 
                                   errorMessage.toLowerCase().includes("cannot create more sites");

                if (isUsageLimit && !isLastToken) {
                    console.warn(`[DeployService] Usage limit reached for token ${tokenIndex + 1}. Trying fallback token...`);
                    continue; // Try next token
                }

                throw new Error(errorMessage);
            }

            console.log(`[DeployService] ✅ Netlify deploy successful: ${data.url || data.deploy_url}`);

            // If it's a new site creation, Netlify returns '.id' as siteId and '.url'
            // If it's a deploy update, Netlify returns '.site_id' and '.url'
            const siteId = data.id || data.site_id;
            const publicUrl = data.url;

            return { siteId, publicUrl };

        } catch (error) {
            lastError = error;
            // If it's not a usage limit error, or it's the last token, rethrow
            if (!error.message.toLowerCase().includes("usage limit") && 
                !error.message.toLowerCase().includes("cannot create more sites") || isLastToken) {
                throw error;
            }
            console.warn(`[DeployService] Error with token ${tokenIndex + 1}: ${error.message}. Trying fallback...`);
        }
    }

    throw lastError || new Error("Deployment failed after trying all available tokens.");
};

module.exports = { deployProject };

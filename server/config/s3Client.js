const { S3Client } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

// Ensure environment variables are loaded
dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

// Verify required variables
if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn("⚠️  Cloudflare R2 credentials missing in .env file. Deployment features will be disabled.");
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
});

module.exports = {
    s3Client,
    bucketName
};

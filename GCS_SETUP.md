# Google Cloud Storage Setup for Video Uploads

This guide will help you set up Google Cloud Storage for video uploads while keeping Cloudinar## Step 9: Security Setup## Step 11: Test the Setup

1. Restart your development server: `npm run dev`
2. Try uploading a video on your feed page
3. Check the browser console and server logs for any errors

**Important**: If videos still don't load after following these steps, the most common issue is missing CORS configuration. Make sure you completed Step 5 correctly.d `gcs-key.json` to your `.gitignore`:

```gitignore
# Google Cloud Service Account Key
gcs-key.json
```

## Step 10: Update Content Security Policyes.

## Why This Setup?

- **Cloudinary Free Tier**: Limited to ~100MB video uploads
- **Google Cloud Storage**: Much larger file support (up to 5TB per file)
- **Cost Effective**: Pay only for what you use
- **Better Performance**: Optimized for large video files

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID** - you'll need this

## Step 2: Enable Cloud Storage API

1. In Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Cloud Storage API"
3. Click **Enable**

## Step 3: Create Storage Bucket

1. Go to **Cloud Storage > Buckets**
2. Click **Create Bucket**
3. Choose a unique bucket name (e.g., `your-app-name-videos`)
4. Select **Region** closest to your users
5. Choose **Standard** storage class
6. **Important**: Set **Public access prevention** to **OFF** (we need public access for videos)
7. Click **Create**

## Step 4: Set Bucket Permissions for Public Access

Since we need videos to be publicly accessible, we have two options:

### Option A: Disable Uniform Bucket-Level Access (Recommended for simplicity)

1. Go to your bucket
2. Click on **Permissions** tab
3. Click **Switch to fine-grained** (if uniform bucket-level access is enabled)
4. Confirm the change
5. Add permissions:
   - **New principals**: `allUsers`
   - **Role**: `Storage Object Viewer`
6. Click **Save**

### Option B: Keep Uniform Bucket-Level Access (More secure)

1. Go to your bucket
2. Click on **Permissions** tab
3. Click **Add Principal**
4. Add these permissions:
   - **New principals**: `allUsers`
   - **Role**: `Storage Object Viewer`
5. Click **Save**

**Note**: With uniform bucket-level access, all objects in the bucket will be publicly readable automatically.

## Step 5: Configure CORS for Web Browser Access

CORS (Cross-Origin Resource Sharing) is required for web browsers to load videos from Google Cloud Storage.

### Option A: Using Google Cloud Console

1. Go to your bucket in Google Cloud Console
2. Click on **Configuration** tab
3. Scroll down to **CORS**
4. Click **Edit**
5. Add this CORS configuration:

```json
[
  {
    "origin": ["http://localhost:3000", "https://your-domain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Range",
      "Accept-Ranges"
    ],
    "maxAgeSeconds": 3600
  }
]
```

6. Replace `https://your-domain.com` with your actual production domain
7. Click **Save**

### Option B: Using Command Line (Alternative)

If you have Google Cloud CLI installed:

1. Create a file called `cors.json`:

```json
[
  {
    "origin": ["http://localhost:3000", "https://your-domain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Range",
      "Accept-Ranges"
    ],
    "maxAgeSeconds": 3600
  }
]
```

2. Run this command:

```bash
gsutil cors set cors.json gs://your-bucket-name
```

## Step 6: Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Name: `video-uploader`
4. Description: `Service account for video uploads`
5. Click **Create and Continue**
6. Add role: **Storage Admin**
7. Click **Continue** then **Done**

## Step 6: Generate Service Account Key

1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Choose **JSON** format
5. Download the key file
6. Rename it to `gcs-key.json`
7. Place it in your project root (same level as package.json)

## Step 7: Update Environment Variables

Add these to your `.env.local` file:

```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_CLOUD_KEY_FILE=./gcs-key.json

# Keep existing Cloudinary config for images
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Step 8: Security Setup

Add `gcs-key.json` to your `.gitignore`:

```gitignore
# Google Cloud Service Account Key
gcs-key.json
```

## Step 9: Update Content Security Policy

The application needs to allow video loading from Google Cloud Storage. This should already be configured, but if you get CSP errors, ensure your `next.config.js` includes Google Cloud Storage in the `media-src` directive:

```javascript
"media-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://storage.googleapis.com https://*.storage.googleapis.com blob: data:";
```

## Step 10: Test the Setup

1. Restart your development server: `npm run dev`
2. Try uploading a video on your feed page
3. Check the browser console and server logs for any errors

## Video Size Limits by Subscription Tier

- **Free**: 100MB
- **Premium**: 500MB
- **Pro**: 2GB

## Troubleshooting

### Common Issues:

1. **"Video upload service is temporarily unavailable"**

   - Check your service account key path
   - Verify bucket exists and is accessible

2. **"Permission denied"**

   - Ensure service account has Storage Admin role
   - Check bucket permissions for public access

3. **"Cannot update access control for an object when uniform bucket-level access is enabled"**

   - This means your bucket has uniform bucket-level access enabled
   - Either: Disable uniform bucket-level access (Step 4, Option A)
   - Or: Make sure bucket-level permissions are set for `allUsers` with `Storage Object Viewer` role
   - The upload should still work, files will be accessible via the returned URL

4. **"Refused to load media" CSP error**

   - This means the Content Security Policy is blocking Google Cloud Storage
   - Check that `next.config.js` includes Google Cloud Storage domains in `media-src`
   - Restart your development server after making CSP changes

5. **Video uploads successfully but won't play in browser**

   - **Most common cause**: Missing CORS configuration
   - Go to your Google Cloud Storage bucket → Configuration → CORS
   - Add the CORS configuration from Step 5
   - Make sure to include your domain(s) in the `origin` array
   - Test the video URL directly in a new browser tab - if it downloads instead of playing, CORS is likely the issue

6. **"Access to fetch at '...' from origin '...' has been blocked by CORS policy"**

   - This confirms CORS is not configured correctly
   - Double-check the CORS configuration in Step 5
   - Ensure your domain is listed in the `origin` array
   - For development, make sure `http://localhost:3000` is included

7. **"Bucket does not exist"**
   - Verify bucket name in environment variables
   - Ensure bucket is in the correct project

### Checking Logs:

- Check server console for GCS upload logs
- Monitor Google Cloud Console > Cloud Storage for upload activity
- Use browser dev tools to check network requests

## Production Deployment

For production (Vercel, etc.):

1. **Option 1**: Upload `gcs-key.json` to your hosting service
2. **Option 2**: Use base64 encoded credentials:
   ```bash
   base64 -i gcs-key.json
   ```
   Then set `GOOGLE_CLOUD_CREDENTIALS_BASE64` environment variable

## Cost Estimation

Google Cloud Storage pricing (as of 2025):

- **Storage**: ~$0.02/GB/month
- **Operations**: ~$0.05 per 10,000 operations
- **Bandwidth**: ~$0.12/GB egress

Example: 100 videos (500MB each) = 50GB = ~$1/month

## Support

If you encounter issues:

1. Check the Google Cloud Console logs
2. Verify all environment variables are set correctly
3. Ensure your service account has proper permissions

# PSC Upload Worker — R2 Audio Storage

Cloudflare Worker that securely proxies audio uploads to R2 without exposing credentials to the frontend.

## Setup

### 1. Create R2 bucket

```bash
wrangler r2 bucket create psc-audio
```

### 2. Enable public access (optional, for direct playback URLs)

In Cloudflare dashboard:
- Go to R2 > psc-audio > Settings
- Enable "Public URL Access"
- Copy the public bucket URL (e.g., `https://pub-{hash}.r2.dev`)

Or use a custom domain:
- Add custom domain in bucket settings
- Point DNS CNAME to R2

### 3. Set environment variable

```bash
cd worker
wrangler secret put R2_PUBLIC_URL
# Paste your public bucket URL when prompted
```

### 4. Deploy worker

```bash
cd worker
wrangler deploy
```

Copy the deployed worker URL (e.g., `https://psc-upload-worker.{your-account}.workers.dev`)

### 5. Update frontend config

In `src/config.js`, set:

```javascript
export const UPLOAD_WORKER_URL = 'https://psc-upload-worker.{your-account}.workers.dev';
```

## Local development

```bash
cd worker
wrangler dev
```

Update frontend to use `http://localhost:8787` for local testing.

## Architecture

```
Frontend (UploadModal)
  ↓ POST /upload (multipart/form-data)
Worker
  ↓ env.PSC_AUDIO.put()
R2 Bucket (psc-audio)
  ↓ public URL
Frontend gets audio_path + public_url
  ↓ INSERT into Supabase
Database (tracks table)
```

## Cost

- R2 Free tier: 10GB storage, 1M Class A ops/month, 10M Class B ops/month
- No egress fees for public URLs
- Worker Free tier: 100k requests/day

Your 121MB audio files fit comfortably in the free tier.

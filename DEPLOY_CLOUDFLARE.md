# Deploy Cloudflare (For D's Access)

localStorage works for you now. To let D upload from his browser, deploy Cloudflare:

## 1. Get API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Add these permissions:
   - Account → D1 → Edit
   - Account → Workers R2 Storage → Edit
5. Copy the token

## 2. Set Token

```bash
export CLOUDFLARE_API_TOKEN=your-token-here
```

## 3. Deploy

```bash
cd /workspaces/psoulc/worker

# Create D1 database
wrangler d1 create psc-tracks
# COPY the database_id from output

# Edit wrangler.toml - replace YOUR_D1_DATABASE_ID

# Create schema
wrangler d1 execute psc-tracks --file=schema.sql

# Create R2 bucket
wrangler r2 bucket create psc-audio

# Deploy worker
npm install
wrangler deploy
# COPY the worker URL

# Set R2 public URL (get from Cloudflare dashboard R2 settings)
wrangler secret put R2_PUBLIC_URL
```

## 4. Update Frontend

Create `.env`:
```
VITE_UPLOAD_WORKER_URL=https://psc-upload-worker.YOUR-NAME.workers.dev
VITE_R2_PUBLIC_URL=https://pub-XXXXX.r2.dev
```

Rebuild: `npm run build`

**DONE.** D can upload from any browser.

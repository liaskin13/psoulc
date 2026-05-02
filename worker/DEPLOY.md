# Deploy PSC Worker (5 minutes)

Run these commands in order. No edits needed.

## 1. Install wrangler globally
```bash
npm install -g wrangler
```

## 2. Login to Cloudflare
```bash
wrangler login
```

## 3. Create D1 database
```bash
wrangler d1 create psc-tracks
```

**COPY THE `database_id` from output**

## 4. Update wrangler.toml
Edit `worker/wrangler.toml`, replace `YOUR_D1_DATABASE_ID` with the ID from step 3

## 5. Create database schema
```bash
wrangler d1 execute psc-tracks --file=schema.sql
```

## 6. Create R2 bucket
```bash
wrangler r2 bucket create psc-audio
```

## 7. Enable R2 public access
- Go to Cloudflare dashboard → R2 → psc-audio → Settings
- Enable "Public URL Access"
- Copy the public URL (looks like `https://pub-xxxxx.r2.dev`)

## 8. Set R2 public URL secret
```bash
wrangler secret put R2_PUBLIC_URL
```
Paste the URL from step 7 when prompted

## 9. Deploy worker
```bash
cd worker
npm install
wrangler deploy
```

**COPY THE WORKER URL** (looks like `https://psc-upload-worker.your-name.workers.dev`)

## 10. Update frontend .env
Create `.env` in project root:
```
VITE_UPLOAD_WORKER_URL=https://psc-upload-worker.your-name.workers.dev
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## 11. Rebuild and test
```bash
npm run build
npm run dev
```

Upload a file. Check Cloudflare dashboard → D1 → psc-tracks → Console:
```sql
SELECT * FROM tracks;
```

You're done. D can now use the system from any browser.

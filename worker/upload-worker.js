// Cloudflare Worker: PSC Audio Upload + Database Proxy
// Handles R2 storage + D1 database without exposing credentials

function parseRangeHeader(range) {
  const m = range && range.match(/^bytes=(\d*)-(\d*)$/);
  if (!m) return {};
  if (m[1] && m[2]) return { offset: parseInt(m[1]), length: parseInt(m[2]) - parseInt(m[1]) + 1 };
  if (m[1]) return { offset: parseInt(m[1]) };
  if (m[2]) return { suffix: parseInt(m[2]) };
  return {};
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i++) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}

async function analyzeWavFromR2(env, audioKey) {
  const hdrObj = await env.PSC_AUDIO.get(audioKey, { range: { offset: 0, length: 512 } });
  if (!hdrObj) return null;
  const hdr = new DataView(await hdrObj.arrayBuffer());

  if (hdr.getUint32(0, false) !== 0x52494646 ||
      hdr.getUint32(8, false) !== 0x57415645) return null;

  const audioFormat    = hdr.getUint16(20, true);
  if (audioFormat !== 1) return null;
  const numChannels    = hdr.getUint16(22, true);
  const sampleRate     = hdr.getUint32(24, true);
  const bitsPerSample  = hdr.getUint16(34, true);
  const bytesPerSample = bitsPerSample / 8;

  let dataOffset = -1, dataSize = 0, pos = 12;
  while (pos + 8 <= 512) {
    const id   = hdr.getUint32(pos, false);
    const size = hdr.getUint32(pos + 4, true);
    if (id === 0x64617461) { dataOffset = pos + 8; dataSize = size; break; }
    pos += 8 + size + (size % 2);
  }
  if (dataOffset < 0) return null;

  const samplesPerFrame = numChannels * bytesPerSample;
  const totalFrames     = Math.floor(dataSize / samplesPerFrame);
  const duration        = totalFrames / sampleRate;
  const barCount        = Math.min(Math.ceil(duration * 50), 250000);
  const samplesPerBar   = Math.max(1, Math.floor(totalFrames / barCount));

  const aLow  = 1 - Math.exp(-2 * Math.PI * 200  / sampleRate);
  const aHigh = 1 - Math.exp(-2 * Math.PI * 2500 / sampleRate);
  let lpLow = 0, lpHigh = 0;

  const bars = [];
  let barBass = 0, barMid = 0, barHigh = 0, barPeak = 0, framesInBar = 0;

  const CHUNK    = 8 * 1024 * 1024;
  let bytePos    = dataOffset;
  const dataEnd  = dataOffset + dataSize;

  while (bytePos < dataEnd && bars.length < barCount) {
    const end      = Math.min(bytePos + CHUNK, dataEnd);
    const chunkObj = await env.PSC_AUDIO.get(audioKey, { range: { offset: bytePos, length: end - bytePos } });
    if (!chunkObj) break;
    const chunk       = new DataView(await chunkObj.arrayBuffer());
    const chunkFrames = Math.floor(chunk.byteLength / samplesPerFrame);

    for (let f = 0; f < chunkFrames && bars.length < barCount; f++) {
      let s = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const off = (f * numChannels + ch) * bytesPerSample;
        if (bitsPerSample === 16)
          s += chunk.getInt16(off, true) / 32768;
        else if (bitsPerSample === 24) {
          const lo = chunk.getUint8(off), mi = chunk.getUint8(off + 1), hi = chunk.getInt8(off + 2);
          s += ((hi << 16) | (mi << 8) | lo) / 8388608;
        } else if (bitsPerSample === 32)
          s += chunk.getInt32(off, true) / 2147483648;
      }
      s /= numChannels;

      lpLow  = aLow  * s + (1 - aLow)  * lpLow;
      lpHigh = aHigh * s + (1 - aHigh) * lpHigh;
      const ab = Math.abs(lpLow), am = Math.abs(lpHigh - lpLow);
      const ah = Math.abs(s - lpHigh), ap = Math.abs(s);
      if (ab > barBass) barBass = ab;
      if (am > barMid)  barMid  = am;
      if (ah > barHigh) barHigh = ah;
      if (ap > barPeak) barPeak = ap;
      framesInBar++;
      if (framesInBar >= samplesPerBar) {
        bars.push({ bass: barBass, mid: barMid, high: barHigh, peak: barPeak });
        barBass = barMid = barHigh = barPeak = framesInBar = 0;
      }
    }
    bytePos = end;
  }
  if (framesInBar > 0) bars.push({ bass: barBass, mid: barMid, high: barHigh, peak: barPeak });

  let maxPeak = 0;
  for (const b of bars) if (b.peak > maxPeak) maxPeak = b.peak;
  maxPeak = Math.max(maxPeak, 0.0001);
  let maxBass = 0, maxMid = 0, maxHigh = 0;
  for (const b of bars) {
    if (b.bass > maxBass) maxBass = b.bass;
    if (b.mid  > maxMid)  maxMid  = b.mid;
    if (b.high > maxHigh) maxHigh = b.high;
  }
  maxBass = Math.max(maxBass, maxPeak * 0.02);
  maxMid  = Math.max(maxMid,  maxPeak * 0.02);
  maxHigh = Math.max(maxHigh, maxPeak * 0.02);

  const bin = new Uint8Array(bars.length * 4);
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    bin[i * 4]     = Math.round(Math.min(1, b.bass / maxBass) * 255);
    bin[i * 4 + 1] = Math.round(Math.min(1, b.mid  / maxMid)  * 255);
    bin[i * 4 + 2] = Math.round(Math.min(1, b.high / maxHigh) * 255);
    bin[i * 4 + 3] = Math.round(Math.min(1, b.peak / maxPeak) * 255);
  }

  return { bin, duration };
}

async function generateAndStoreWaveform(env, audioKey, trackId) {
  try {
    const result = await analyzeWavFromR2(env, audioKey);
    if (!result) return;
    await env.PSC_AUDIO.put(`waveform/${trackId}.bin`, result.bin, {
      httpMetadata: { contentType: "application/octet-stream" },
    });
    await env.PSC_DB.prepare("UPDATE tracks SET waveform_data = ?, duration = ? WHERE id = ?")
      .bind('"v2"', result.duration, trackId).run();
  } catch (err) {
    console.error("[PSC] waveform gen failed:", err);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, PSC-Secret",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const isAuthenticated = timingSafeEqual(
      request.headers.get("PSC-Secret") || "",
      env.PSC_SECRET || "",
    );

    try {
      // GET /health
      if (request.method === "GET" && url.pathname === "/health") {
        let dbOk = false;
        try {
          await env.PSC_DB.prepare("SELECT 1").first();
          dbOk = true;
        } catch (_) {}
        return new Response(
          JSON.stringify({ ok: true, db: dbOk, r2_url: !!env.R2_PUBLIC_URL }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      // POST /access-codes — D generates a listener access code (auth required)
      // A code grants access to all published content; tier controls future permissions.
      if (request.method === "POST" && url.pathname === "/access-codes") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const body = await request.json();
        const { tier = "MEMBERS", granted_to, expires_at } = body;
        const validTiers = ["MASTERS", "MUSES", "MEMBERS"];
        if (!validTiers.includes(tier)) {
          return new Response(JSON.stringify({ error: `tier must be one of: ${validTiers.join(", ")}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (expires_at != null && isNaN(new Date(expires_at).getTime())) {
          return new Response(JSON.stringify({ error: "expires_at must be a valid ISO-8601 date" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Reserved resident PINs — regenerate if collision
        const RESERVED = new Set(["0528", "7677", "0000"]); // 0000 is test-only
        let code;
        do {
          const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
          code = String(n).padStart(4, "0");
        } while (RESERVED.has(code));
        await env.PSC_DB.prepare(
          "INSERT INTO access_codes (id, tier, granted_to, expires_at, created_by) VALUES (?, ?, ?, ?, 'D')"
        ).bind(code, tier, granted_to ?? null, expires_at ?? null).run();
        return new Response(JSON.stringify({ code, url: `https://uoyni.com?code=${code}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /redeem — listener redeems an access code (public)
      // Validates code and returns tier; grants access to all published content.
      if (request.method === "POST" && url.pathname === "/redeem") {
        const body = await request.json();
        const { code, fingerprint } = body;
        if (!code) {
          return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // TEST BYPASS — remove before public launch
        if (code === "0000") {
          return new Response(JSON.stringify({ valid: true, tier: "MEMBERS", grantedTo: "TEST" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const row = await env.PSC_DB.prepare(
          "SELECT id, tier, granted_to, revoked, expires_at, redeemed_at FROM access_codes WHERE id = ?"
        ).bind(code).first();
        if (!row) {
          return new Response(JSON.stringify({ error: "Code not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const isExpired = row.expires_at != null && new Date(row.expires_at) <= new Date();
        if (row.revoked === 1 || isExpired) {
          return new Response(JSON.stringify({ error: "Code expired or revoked" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!row.redeemed_at) {
          await env.PSC_DB.prepare(
            "UPDATE access_codes SET redeemed_at = datetime('now'), redeemed_by = ? WHERE id = ?"
          ).bind(fingerprint ?? null, code).run();
        }
        return new Response(JSON.stringify({
          valid: true,
          tier: row.tier,
          grantedTo: row.granted_to,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // PUT /access-codes/:id/revoke — D revokes a code (auth required)
      if (request.method === "PUT" && url.pathname.match(/^\/access-codes\/[^/]+\/revoke$/)) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const id = url.pathname.split("/")[2];
        const { success } = await env.PSC_DB.prepare("UPDATE access_codes SET revoked = 1 WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // GET /access-codes — D lists active codes (auth required)
      if (request.method === "GET" && url.pathname === "/access-codes") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { results } = await env.PSC_DB.prepare(
          `SELECT id, tier, granted_to, expires_at, redeemed_at, revoked, created_at
           FROM access_codes
           WHERE revoked = 0
           ORDER BY created_at DESC`
        ).all();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // GET /vaults — listener dock: only vaults with ≥1 published track (public)
      // Authenticated view (console) returns all visible vaults regardless of track count.
      if (request.method === "GET" && url.pathname === "/vaults") {
        let results;
        if (isAuthenticated) {
          ({ results } = await env.PSC_DB.prepare(
            `SELECT vault_id, label, color, visibility, copy, sort_order
             FROM vault_config
             ORDER BY sort_order ASC`
          ).all());
        } else {
          ({ results } = await env.PSC_DB.prepare(
            `SELECT vc.vault_id, vc.label, vc.color, vc.copy, vc.sort_order
             FROM vault_config vc
             WHERE vc.visibility = 1
               AND EXISTS (
                 SELECT 1 FROM tracks t
                 WHERE t.vault = vc.vault_id AND t.is_published = 1 AND t.is_voided = 0
               )
             ORDER BY vc.sort_order ASC`
          ).all());
        }
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /vaults/:id — D updates vault config (auth required)
      if (request.method === "PUT" && url.pathname.match(/^\/vaults\/[^/]+$/) && !url.pathname.endsWith("/revoke")) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const vaultId = url.pathname.split("/")[2];
        const body = await request.json();
        const allowed = ["label", "color", "visibility", "copy", "sort_order"];
        const fields = Object.keys(body).filter(k => allowed.includes(k));
        if (fields.length === 0) {
          return new Response(JSON.stringify({ error: "No valid fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const setClauses = [...fields.map(f => `${f} = ?`), "updated_at = datetime('now')"].join(", ");
        const values = fields.map(f => body[f]);
        await env.PSC_DB.prepare(
          `INSERT INTO vault_config (vault_id, label, color, visibility, copy, sort_order)
           VALUES (?, 'VAULT', NULL, 1, NULL, 0)
           ON CONFLICT(vault_id) DO UPDATE SET ${setClauses}`
        ).bind(vaultId, ...values).run();
        return new Response(JSON.stringify({ success: true, vault_id: vaultId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /tracks/:id — D saves D-bank cue labels (auth required)
      if (request.method === "PUT" && url.pathname.match(/^\/tracks\/[^/]+$/) && !url.pathname.endsWith("/revoke")) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const trackId = url.pathname.split("/")[2];
        const body = await request.json();
        const allowed = ["cue_labels"];
        const fields = Object.keys(body).filter(k => allowed.includes(k));
        if (fields.length === 0) {
          return new Response(JSON.stringify({ error: "No valid fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const cueLabelsJson = body.cue_labels != null ? JSON.stringify(body.cue_labels) : null;
        await env.PSC_DB.prepare(
          `UPDATE tracks SET cue_labels = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(cueLabelsJson, trackId).run();
        return new Response(JSON.stringify({ success: true, id: trackId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /tracks/:vault
      if (request.method === "GET" && url.pathname.startsWith("/tracks/")) {
        const vault = url.pathname.split("/")[2];
        // Authenticated (console) gets all tracks; unauthenticated (listener) gets published only
        const publishClause = isAuthenticated ? "" : " AND is_published = 1";
        const { results } = await env.PSC_DB.prepare(
          `SELECT id, vault, title, artist, bpm, bpm_display, musical_key, duration, audio_path, waveform_data, created_at, is_published FROM tracks WHERE vault = ? AND is_voided = 0${publishClause} ORDER BY created_at DESC`,
        )
          .bind(vault)
          .all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /tracks
      if (request.method === "GET" && url.pathname === "/tracks") {
        const { results } = await env.PSC_DB.prepare(
          "SELECT id, vault, title, artist, bpm, bpm_display, musical_key, duration, audio_path, waveform_data, created_at, is_published FROM tracks WHERE is_voided = 0 ORDER BY created_at DESC",
        ).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /tracks/:id/publish
      if (request.method === "PUT" && url.pathname.match(/^\/tracks\/[^/]+\/publish$/)) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const id = url.pathname.split("/")[2];
        const { success } = await env.PSC_DB.prepare("UPDATE tracks SET is_published = 1 WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // PUT /tracks/:id/retract
      if (request.method === "PUT" && url.pathname.match(/^\/tracks\/[^/]+\/retract$/)) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const id = url.pathname.split("/")[2];
        const { success } = await env.PSC_DB.prepare("UPDATE tracks SET is_published = 0 WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // PATCH /tracks/:id — update metadata (title, artist, bpm, bpm_display, musical_key)
      if (request.method === "PATCH" && url.pathname.match(/^\/tracks\/[^/]+$/) && !url.pathname.includes("/publish") && !url.pathname.includes("/retract")) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const id = url.pathname.split("/")[2];
        const body = await request.json();
        const allowed = ["title", "artist", "bpm", "bpm_display", "musical_key"];
        const fields = Object.keys(body).filter(k => allowed.includes(k));
        if (fields.length === 0) {
          return new Response(JSON.stringify({ error: "No valid fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const setClauses = fields.map(f => `${f} = ?`).join(", ");
        const values = fields.map(f => body[f]);
        const { success } = await env.PSC_DB.prepare(`UPDATE tracks SET ${setClauses} WHERE id = ?`).bind(...values, id).run();
        return new Response(JSON.stringify({ success }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // GET /audio/:key — stream from R2 with Content-Type + Range support (CORS-safe for Web Audio API)
      if (request.method === "GET" && url.pathname.startsWith("/audio/")) {
        const key = decodeURIComponent(url.pathname.slice(7));
        if (!key) return new Response("Bad key", { status: 400, headers: corsHeaders });
        const ext = key.split(".").pop().toLowerCase();
        const contentType = { wav: "audio/wav", mp3: "audio/mpeg", flac: "audio/flac", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg" }[ext] || "audio/mpeg";
        const rangeHeader = request.headers.get("Range");
        const obj = rangeHeader
          ? await env.PSC_AUDIO.get(key, { range: { suffix: undefined, ...parseRangeHeader(rangeHeader) } })
          : await env.PSC_AUDIO.get(key);
        if (!obj) return new Response("Not found", { status: 404, headers: corsHeaders });
        const resHeaders = { ...corsHeaders, "Content-Type": contentType, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000" };
        if (rangeHeader && obj.range) resHeaders["Content-Range"] = `bytes ${obj.range.offset}-${obj.range.offset + obj.range.length - 1}/${obj.size}`;
        return new Response(obj.body, { status: rangeHeader && obj.range ? 206 : 200, headers: resHeaders });
      }

      // POST /upload-init  — start a multipart upload, return uploadId + key
      if (request.method === "POST" && url.pathname === "/upload-init") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const body = await request.json();
        const { vault, filename, contentType } = body;
        if (!vault || !filename) {
          return new Response(JSON.stringify({ error: "Missing vault or filename" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const ext = filename.split(".").pop().toLowerCase();
        const key = `${vault}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const mpu = await env.PSC_AUDIO.createMultipartUpload(key, {
          httpMetadata: { contentType: contentType || "audio/mpeg" },
        });
        return new Response(
          JSON.stringify({ uploadId: mpu.uploadId, key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // PUT /upload-part?key=&uploadId=&partNumber=  — upload one chunk
      if (request.method === "PUT" && url.pathname === "/upload-part") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const key = url.searchParams.get("key");
        const uploadId = url.searchParams.get("uploadId");
        const partNumber = parseInt(url.searchParams.get("partNumber"), 10);
        if (!key || !uploadId || !partNumber) {
          return new Response(JSON.stringify({ error: "Missing key, uploadId or partNumber" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const mpu = env.PSC_AUDIO.resumeMultipartUpload(key, uploadId);
        const data = await request.arrayBuffer();
        const part = await mpu.uploadPart(partNumber, data);
        return new Response(
          JSON.stringify({ partNumber: part.partNumber, etag: part.etag }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // POST /upload-complete  — finish multipart upload, save track to D1
      if (request.method === "POST" && url.pathname === "/upload-complete") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const body = await request.json();
        const { key, uploadId, parts, vault, title, artist, bpm, uploaded_by, waveform_data, duration } = body;
        if (!key || !uploadId || !parts || !vault || !title) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const mpu = env.PSC_AUDIO.resumeMultipartUpload(key, uploadId);
        await mpu.complete(parts);
        const result = await env.PSC_DB.prepare(
          "INSERT INTO tracks (vault, title, artist, bpm, bpm_display, audio_path, uploaded_by, waveform_data, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
        )
          .bind(vault, title, artist || null, bpm ? parseFloat(String(bpm).split("-")[0]) : null, bpm || null, key, uploaded_by, waveform_data || null, duration || null)
          .first();
        if (!result) {
          throw new Error(`Database insert failed: vault=${vault} title="${title}"`);
        }
        return new Response(
          JSON.stringify({ success: true, id: result.id, audio_path: key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // POST /upload
      if (request.method === "POST" && url.pathname === "/upload") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const vault = formData.get("vault");
        const title = formData.get("title");
        const artist = formData.get("artist");
        const bpm = formData.get("bpm");
        const uploaded_by = formData.get("uploaded_by");

        if (!file || !vault || !title) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: file, vault, title",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const ext = (file.name || "audio").split(".").pop().toLowerCase();
        const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const key = `${vault}/${filename}`;

        // Stream file directly to R2 — no arrayBuffer(), no memory limit
        await env.PSC_AUDIO.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || "audio/mpeg",
          },
        });

        const result = await env.PSC_DB.prepare(
          "INSERT INTO tracks (vault, title, artist, bpm, bpm_display, audio_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
        )
          .bind(
            vault,
            title,
            artist || null,
            bpm ? parseFloat(String(bpm).split("-")[0]) : null,
            bpm || null,
            key,
            uploaded_by,
          )
          .first();

        if (!result) {
          await env.PSC_AUDIO.delete(key);
          throw new Error(
            `Database insert failed: vault=${vault} title="${title}"`,
          );
        }

        // Return the key — frontend constructs full URL from VITE_R2_PUBLIC_URL
        return new Response(
          JSON.stringify({
            success: true,
            id: result.id,
            audio_path: key,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // PUT /tracks/:id/void
      if (
        request.method === "PUT" &&
        url.pathname.match(/^\/tracks\/[^\/]+\/void$/)
      ) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const id = url.pathname.split("/")[2];
        const { success } = await env.PSC_DB.prepare(
          "UPDATE tracks SET is_voided = 1 WHERE id = ?",
        )
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /tracks/:id/waveform
      if (
        request.method === "POST" &&
        url.pathname.match(/^\/tracks\/[^\/]+\/waveform$/)
      ) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const id = url.pathname.split("/")[2];
        const body = await request.json();
        const { waveform_data, duration } = body;
        const waveformValue = waveform_data == null ? null : JSON.stringify(waveform_data);
        const { success } = await env.PSC_DB.prepare(
          duration != null
            ? "UPDATE tracks SET waveform_data = ?, duration = ? WHERE id = ?"
            : "UPDATE tracks SET waveform_data = ? WHERE id = ?",
        )
          .bind(...(duration != null
            ? [waveformValue, duration, id]
            : [waveformValue, id]))
          .run();

        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /tracks/:id/waveform-assets — store high-res binary + PNG in R2
      if (
        request.method === "PUT" &&
        url.pathname.match(/^\/tracks\/[^\/]+\/waveform-assets$/)
      ) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rawId = url.pathname.split("/")[2];
        const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
        if (!id) {
          return new Response(JSON.stringify({ error: "Invalid track id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await request.json();
        const { binary_b64, png_b64 } = body;

        if (!binary_b64) {
          return new Response(JSON.stringify({ error: "binary_b64 required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Decode and size-check binary (~960KB max for 240k bars)
        const binaryStr = atob(binary_b64);
        if (binaryStr.length > 1572864) { // 1.5MB
          return new Response(JSON.stringify({ error: "binary too large" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const binaryBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) binaryBytes[i] = binaryStr.charCodeAt(i);

        await env.PSC_AUDIO.put(`waveform/${id}.bin`, binaryBytes, {
          httpMetadata: { contentType: "application/octet-stream" },
        });

        if (png_b64) {
          const pngStr = atob(png_b64);
          if (pngStr.length <= 204800) { // 200KB
            const pngBytes = new Uint8Array(pngStr.length);
            for (let i = 0; i < pngStr.length; i++) pngBytes[i] = pngStr.charCodeAt(i);
            await env.PSC_AUDIO.put(`waveform/${id}.png`, pngBytes, {
              httpMetadata: { contentType: "image/png" },
            });
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /tracks/:id/regenerate-waveform — server-side WAV analysis from R2
      if (request.method === "POST" &&
          url.pathname.match(/^\/tracks\/[^/]+\/regenerate-waveform$/)) {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rid = url.pathname.split("/")[2].replace(/[^a-zA-Z0-9_-]/g, "");
        if (!rid) {
          return new Response(JSON.stringify({ error: "Invalid id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const row = await env.PSC_DB.prepare("SELECT audio_path FROM tracks WHERE id = ?")
          .bind(rid).first();
        if (!row) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await generateAndStoreWaveform(env, row.audio_path, rid);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /signal — public; returns D's current broadcast state for listener polling
      if (request.method === "GET" && url.pathname === "/signal") {
        try {
          const row = await env.PSC_DB.prepare(
            "SELECT is_live, title FROM signal WHERE id = 1",
          ).first();
          return new Response(
            JSON.stringify(row ?? { is_live: 0, title: null }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        } catch (_) {
          return new Response(
            JSON.stringify({ is_live: 0, title: null }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // PUT /signal — auth required; D's console sets broadcast state
      if (request.method === "PUT" && url.pathname === "/signal") {
        if (!isAuthenticated) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const body = await request.json();
        const isLive = body.is_live ? 1 : 0;
        const title = body.title ?? null;
        await env.PSC_DB.prepare(
          "INSERT INTO signal (id, is_live, title) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET is_live = excluded.is_live, title = excluded.title",
        )
          .bind(isLive, title)
          .run();
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Worker error:", error.message, { vault: url.pathname });
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  },
};

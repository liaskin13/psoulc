// Cloudflare Worker: PSC Audio Upload + Database Proxy
// Handles R2 storage + D1 database without exposing credentials

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

export default {
  async fetch(request, env) {
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
        const { key, uploadId, parts, vault, title, artist, bpm, uploaded_by } = body;
        if (!key || !uploadId || !parts || !vault || !title) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const mpu = env.PSC_AUDIO.resumeMultipartUpload(key, uploadId);
        await mpu.complete(parts);
        const result = await env.PSC_DB.prepare(
          "INSERT INTO tracks (vault, title, artist, bpm, bpm_display, audio_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
        )
          .bind(vault, title, artist || null, bpm ? parseFloat(String(bpm).split("-")[0]) : null, bpm || null, key, uploaded_by)
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
        const { success } = await env.PSC_DB.prepare(
          duration != null
            ? "UPDATE tracks SET waveform_data = ?, duration = ? WHERE id = ?"
            : "UPDATE tracks SET waveform_data = ? WHERE id = ?",
        )
          .bind(...(duration != null
            ? [JSON.stringify(waveform_data), duration, id]
            : [JSON.stringify(waveform_data), id]))
          .run();

        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response("Not found", { status: 404 });
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

// Cloudflare Worker: PSC Audio Upload + Database Proxy
// Handles R2 storage + D1 database without exposing credentials

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

    const isAuthenticated =
      request.headers.get("PSC-Secret") === env.PSC_SECRET;

    try {
      // GET /tracks/:vault
      if (request.method === "GET" && url.pathname.startsWith("/tracks/")) {
        const vault = url.pathname.split("/")[2];
        const { results } = await env.PSC_DB.prepare(
          "SELECT * FROM tracks WHERE vault = ? AND is_voided = 0 ORDER BY created_at DESC",
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
          "SELECT id, vault, title, artist, bpm, created_at FROM tracks WHERE is_voided = 0 ORDER BY created_at DESC",
        ).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const key = `${vault}/${filename}`;

        await env.PSC_AUDIO.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || "application/octet-stream",
          },
        });

        const result = await env.PSC_DB.prepare(
          "INSERT INTO tracks (vault, title, artist, bpm, audio_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
        )
          .bind(
            vault,
            title,
            artist || null,
            bpm ? parseFloat(bpm) : null,
            key,
            uploaded_by,
          )
          .first();

        if (!result) {
          await env.PSC_AUDIO.delete(key);
          throw new Error("Database insert failed");
        }

        const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

        return new Response(
          JSON.stringify({
            success: true,
            id: result.id,
            audio_path: key,
            public_url: publicUrl,
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
        const { waveform_data } = await request.json();
        const { success } = await env.PSC_DB.prepare(
          "UPDATE tracks SET waveform_data = ? WHERE id = ?",
        )
          .bind(JSON.stringify(waveform_data), id)
          .run();

        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
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

// Cloudflare Worker: R2 Upload Proxy
// Securely handles audio file uploads to R2 without exposing credentials to frontend

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const vault = formData.get("vault");

      if (!file) {
        return new Response("No file provided", { status: 400 });
      }

      if (!vault) {
        return new Response("No vault specified", { status: 400 });
      }

      // Generate R2 key: {vault}/{timestamp}-{random}.{ext}
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const key = `${vault}/${filename}`;

      // Upload to R2
      await env.PSC_AUDIO.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
        },
      });

      // Return public URL
      // Format: https://{bucket}.{account-id}.r2.cloudflarestorage.com/{key}
      // Or use custom domain if configured
      const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

      return new Response(
        JSON.stringify({
          success: true,
          audio_path: key,
          public_url: publicUrl,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } catch (error) {
      console.error("Upload error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  },
};

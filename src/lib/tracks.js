import { supabase } from "./supabase";
import { UPLOAD_WORKER_URL } from "../config";

// Fetch all active (non-voided) tracks for a given vault
export async function fetchVaultTracks(vault) {
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("vault", vault)
    .eq("is_voided", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PSC] fetchVaultTracks error:", error.message);
    return [];
  }
  return data;
}

// Upload an audio file + insert track record
// metadata: { vault, title, artist?, bpm?, frequency_hz?, uploaded_by }
export async function uploadTrack(file, metadata) {
  // Upload to R2 via Cloudflare Worker
  const formData = new FormData();
  formData.append("file", file);
  formData.append("vault", metadata.vault);

  const uploadResponse = await fetch(UPLOAD_WORKER_URL, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse
      .json()
      .catch(() => ({ error: "Upload failed" }));
    throw new Error(`STORAGE: ${errorData.error || uploadResponse.statusText}`);
  }

  const { audio_path, public_url } = await uploadResponse.json();

  // Insert track record into Supabase
  const { data, error } = await supabase
    .from("tracks")
    .insert({
      vault: metadata.vault,
      title: metadata.title,
      artist: metadata.artist || null,
      bpm: metadata.bpm || null,
      frequency_hz: metadata.frequency_hz || null,
      audio_path: audio_path,
      uploaded_by: metadata.uploaded_by,
    })
    .select()
    .single();

  if (error) {
    // Note: R2 cleanup would require a separate worker endpoint
    // For now, orphaned files stay in R2 (acceptable for MVP)
    throw new Error(
      `DB: ${error.message} (vault=${metadata.vault}, path=${audio_path})`,
    );
  }
  return data;
}

// Mark a track as voided (non-destructive — stays in DB)
export async function voidTrack(id) {
  const { error } = await supabase
    .from("tracks")
    .update({ is_voided: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// Fetch all active tracks across all vaults (for audit/admin views)
export async function fetchAllTracks() {
  const { data, error } = await supabase
    .from("tracks")
    .select("id, vault, title, artist, bpm, created_at")
    .eq("is_voided", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PSC] fetchAllTracks error:", error.message);
    return [];
  }
  return data;
}

// Get the public URL for a stored audio file
// With R2, we construct the URL from the R2 public domain
export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  // R2 public URL format: https://pub-{hash}.r2.dev/{audio_path}
  // Or custom domain: https://audio.psoulc.com/{audio_path}
  const r2PublicDomain =
    import.meta.env.VITE_R2_PUBLIC_URL || "https://pub-placeholder.r2.dev";
  return `${r2PublicDomain}/${audio_path}`;
}

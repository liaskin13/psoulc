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
  // LOCAL STORAGE FALLBACK (dev mode)
  // Store file as base64 data URL in localStorage
  const audio_path = `${metadata.vault}/${Date.now()}-${file.name}`;
  
  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const dataUrl = await dataUrlPromise;
  
  // Store in localStorage
  const storageKey = `psc_audio_${audio_path.replace(/\//g, '_')}`;
  try {
    localStorage.setItem(storageKey, dataUrl);
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('STORAGE: localStorage quota exceeded. Clear old uploads or use R2 backend.');
    }
    throw new Error(`STORAGE: ${e.message}`);
  }

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
    localStorage.removeItem(storageKey);
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
// LOCAL STORAGE FALLBACK: returns data URL from localStorage
export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  const storageKey = `psc_audio_${audio_path.replace(/\//g, '_')}`;
  return localStorage.getItem(storageKey);
}

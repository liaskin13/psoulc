// DEV MODE STORAGE: In-memory + localStorage fallback
// No Supabase, no external services. Pure local testing.

const TRACKS_STORAGE_KEY = "psc_dev_tracks";

function loadTracksFromStorage() {
  try {
    const raw = localStorage.getItem(TRACKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTracksToStorage(tracks) {
  try {
    localStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(tracks));
  } catch (e) {
    console.warn("Failed to save tracks to localStorage:", e);
  }
}

// Fetch all active (non-voided) tracks for a given vault
export async function fetchVaultTracks(vault) {
  const allTracks = loadTracksFromStorage();
  return allTracks.filter((t) => t.vault === vault && !t.is_voided);
}

// Upload an audio file + insert track record
// metadata: { vault, title, artist?, bpm?, frequency_hz?, uploaded_by }
export async function uploadTrack(file, metadata) {
  const allTracks = loadTracksFromStorage();

  const newTrack = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    vault: metadata.vault,
    title: metadata.title,
    artist: metadata.artist || null,
    bpm: metadata.bpm || null,
    frequency_hz: metadata.frequency_hz || null,
    audio_path: `pending/${metadata.vault}/${file.name}`,
    uploaded_by: metadata.uploaded_by,
    is_voided: false,
    created_at: new Date().toISOString(),
  };

  allTracks.push(newTrack);
  saveTracksToStorage(allTracks);

  return newTrack;
}

// Mark a track as voided (non-destructive — stays in DB)
export async function voidTrack(id) {
  const allTracks = loadTracksFromStorage();
  const track = allTracks.find((t) => t.id === id);
  if (track) {
    track.is_voided = true;
    saveTracksToStorage(allTracks);
  }
}

// Fetch all active tracks across all vaults (for audit/admin views)
export async function fetchAllTracks() {
  const allTracks = loadTracksFromStorage();
  return allTracks
    .filter((t) => !t.is_voided)
    .map(({ id, vault, title, artist, bpm, created_at }) => ({
      id,
      vault,
      title,
      artist,
      bpm,
      created_at,
    }));
}

// Get the public URL for a stored audio file
// DEV MODE: returns null (playback disabled until R2 configured)
export function getAudioUrl(audio_path) {
  return null; // Playback disabled in dev mode
}

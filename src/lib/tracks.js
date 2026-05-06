// PSC Track Library — Worker API in production, localStorage in dev.
// Dev mode: UPLOAD_WORKER_URL includes "localhost"
// Production: all reads/writes go through the Cloudflare Worker / D1 / R2

import { UPLOAD_WORKER_URL, UPLOAD_SECRET, R2_PUBLIC_URL } from "../config";

const IS_DEV = UPLOAD_WORKER_URL.includes("localhost");
const TRACKS_STORAGE_KEY = "psc_dev_tracks";

// ── Dev-mode localStorage helpers ────────────────────────────────────────────

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(TRACKS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToStorage(tracks) {
  try {
    localStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(tracks));
  } catch (e) {
    console.warn("[PSC] localStorage save failed:", e);
  }
}

// ── Worker fetch helper ───────────────────────────────────────────────────────

async function workerGet(path) {
  const res = await fetch(`${UPLOAD_WORKER_URL}${path}`, {
    headers: UPLOAD_SECRET ? { "PSC-Secret": UPLOAD_SECRET } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchVaultTracks(vault) {
  if (IS_DEV) {
    return loadFromStorage().filter((t) => t.vault === vault && !t.is_voided);
  }
  const results = await workerGet(`/tracks/${vault}`);
  return Array.isArray(results) ? results : [];
}

export async function fetchAllTracks() {
  if (IS_DEV) {
    return loadFromStorage()
      .filter((t) => !t.is_voided)
      .map(({ id, vault, title, artist, bpm, musical_key, created_at }) => ({
        id, vault, title, artist, bpm, musical_key, created_at,
      }));
  }
  const results = await workerGet("/tracks");
  return Array.isArray(results) ? results : [];
}

export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  if (IS_DEV) return null;
  if (!R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${audio_path}`;
}

export function countVaultTracks(vault) {
  // Synchronous — always uses localStorage cache regardless of mode.
  // In production this reflects whatever was last loaded into memory via fetchVaultTracks.
  return loadFromStorage().filter((t) => t.vault === vault && !t.is_voided).length;
}

// ── Dev-only write helpers (no-ops in production — Worker handles writes) ────

export async function uploadTrack(file, metadata) {
  if (!IS_DEV) return null;
  const allTracks = loadFromStorage();
  const newTrack = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    vault: metadata.vault,
    title: metadata.title,
    artist: metadata.artist || null,
    bpm: metadata.bpm || null,
    audio_path: `pending/${metadata.vault}/${file.name}`,
    uploaded_by: metadata.uploaded_by,
    is_voided: false,
    created_at: new Date().toISOString(),
  };
  allTracks.push(newTrack);
  saveToStorage(allTracks);
  return newTrack;
}

export async function voidTrack(id) {
  if (!IS_DEV) return;
  const allTracks = loadFromStorage();
  const track = allTracks.find((t) => t.id === id);
  if (track) {
    track.is_voided = true;
    saveToStorage(allTracks);
  }
}

export async function saveTrackHotCues(id, hotCues) {
  const allTracks = loadFromStorage();
  const track = allTracks.find((t) => t.id === id);
  if (track) {
    track.hot_cues = JSON.stringify(hotCues);
    saveToStorage(allTracks);
  }
}

export async function saveTrackWaveform(id, waveformData) {
  const allTracks = loadFromStorage();
  const track = allTracks.find((t) => t.id === id);
  if (track) {
    track.waveform_data = JSON.stringify(waveformData);
    saveToStorage(allTracks);
  }
}

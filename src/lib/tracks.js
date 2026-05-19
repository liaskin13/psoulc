import { UPLOAD_WORKER_URL, UPLOAD_SECRET, R2_PUBLIC_URL } from "../config";
import { parseSeratoOverview } from "./seratoParser";
import { preprocessAudio } from "./audioPreprocessor";

const IS_DEV = UPLOAD_WORKER_URL.includes("localhost");
const TRACKS_STORAGE_KEY = "psc_dev_tracks";
const CHUNK_SIZE_BYTES = 50 * 1024 * 1024;

function authHeaders(extra = {}) {
  if (!UPLOAD_SECRET) return { ...extra };
  return {
    ...extra,
    "PSC-Secret": UPLOAD_SECRET,
  };
}

async function readWorkerError(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (body?.error) return body.error;
  return `HTTP ${res.status}`;
}

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

async function workerGet(path) {
  const res = await fetch(`${UPLOAD_WORKER_URL}${path}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await readWorkerError(res));
  }
  return res.json();
}

export async function fetchVaultTracks(vault) {
  if (IS_DEV) {
    return loadFromStorage().filter((t) => t.vault === vault && !t.is_voided);
  }
  const results = await workerGet(`/tracks/${vault}`);
  return Array.isArray(results) ? results : [];
}

// Listener-facing: no auth header — worker returns published tracks only.
export async function fetchPublishedVaultTracks(vault) {
  if (IS_DEV) {
    return loadFromStorage().filter(
      (t) => t.vault === vault && !t.is_voided && t.is_published,
    );
  }
  const res = await fetch(`${UPLOAD_WORKER_URL}/tracks/${vault}`);
  if (!res.ok) return [];
  const results = await res.json();
  return Array.isArray(results) ? results : [];
}

export async function fetchAllTracks() {
  if (IS_DEV) {
    return loadFromStorage()
      .filter((t) => !t.is_voided)
      .map((t) => ({ ...t }));
  }
  const results = await workerGet("/tracks");
  return Array.isArray(results) ? results : [];
}

export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  if (IS_DEV) return null;
  return `${UPLOAD_WORKER_URL}/audio/${audio_path}`;
}

export function countVaultTracks(vault) {
  return loadFromStorage().filter((t) => t.vault === vault && !t.is_voided)
    .length;
}

export async function uploadTrack(file, metadata, onProgress) {
  const reportProgress = (stage, percent, detail = "") => {
    if (!onProgress) return;
    onProgress({ stage, percent, detail });
  };

  if (!IS_DEV) {
    let waveformData = null;
    let duration = null;
    try {
      reportProgress("analyzing", 5, "Reading track data");
      const seratoResult = await parseSeratoOverview(file);
      if (seratoResult) {
        waveformData = { low: seratoResult.low, high: seratoResult.high };
      } else {
        const waveformProgress = (pct) =>
          reportProgress("analyzing", Math.round(pct * 0.20 + 5), "Analyzing audio...");
        const result = await preprocessAudio(file, waveformProgress);
        waveformData = result.waveformData;
        duration = result.duration;
      }
    } catch (e) {
      console.warn("[PSC] Waveform analysis failed, uploading without:", e);
    }

    reportProgress("init", 28, "Initializing upload session");

    const initRes = await fetch(`${UPLOAD_WORKER_URL}/upload-init`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        vault: metadata.vault,
        filename: file.name,
        contentType: file.type || "audio/mpeg",
      }),
    });

    if (!initRes.ok) {
      throw new Error(await readWorkerError(initRes));
    }

    const { uploadId, key } = await initRes.json();
    if (!uploadId || !key) {
      throw new Error("Upload initialization failed: missing uploadId/key");
    }

    const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));
    const parts = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      const start = (partNumber - 1) * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
      const chunk = file.slice(start, end);

      reportProgress(
        "chunking",
        Math.round(28 + (partNumber / totalParts) * 57),
        `Uploading chunk ${partNumber}/${totalParts}`,
      );

      const partRes = await fetch(
        `${UPLOAD_WORKER_URL}/upload-part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
        {
          method: "PUT",
          headers: authHeaders({
            "Content-Type": "application/octet-stream",
          }),
          body: chunk,
        },
      );

      if (!partRes.ok) {
        throw new Error(await readWorkerError(partRes));
      }

      const part = await partRes.json();
      if (!part?.etag) {
        throw new Error(`Upload chunk ${partNumber} failed: missing etag`);
      }
      parts.push({ partNumber, etag: part.etag });
    }

    reportProgress("finalize", 90, "Finalizing multipart upload");
    reportProgress("db-write", 95, "Writing track metadata");

    const completeRes = await fetch(`${UPLOAD_WORKER_URL}/upload-complete`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        key,
        uploadId,
        parts,
        vault: metadata.vault,
        title: metadata.title,
        artist: metadata.artist || null,
        bpm: metadata.bpm || null,
        uploaded_by: metadata.uploaded_by,
        waveform_data: waveformData ? JSON.stringify(waveformData) : null,
        duration: duration || null,
      }),
    });

    if (!completeRes.ok) {
      throw new Error(await readWorkerError(completeRes));
    }

    const completed = await completeRes.json();
    reportProgress("done", 100, "Upload complete");

    window.dispatchEvent(new CustomEvent("psc:track-uploaded"));
    return completed;
  }

  reportProgress("db-write", 95, "Saving local track entry");
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
  reportProgress("done", 100, "Upload complete");
  window.dispatchEvent(new CustomEvent("psc:track-uploaded"));
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

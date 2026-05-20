// Streaming audio engine using HTMLAudioElement — native playback only.
// Web Audio API is NOT used for playback. No createMediaElementSource().
// VU/spectrum meters are waveform-data-driven (see useAudioAnalyzer.js).

let audio = null;
let _volume = 0.85;
let stateListeners = [];

// Kept for Safari compat — creates AudioContext in gesture scope but never
// connects it to the audio element.
let _audioCtx = null;

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.volume = _volume;
    audio.preload = "metadata";
    audio.addEventListener("ended", () => notifyListeners());
    audio.addEventListener("pause", () => notifyListeners());
    audio.addEventListener("play", () => notifyListeners());
    audio.addEventListener("timeupdate", () => notifyListeners());
    audio.addEventListener("durationchange", () => notifyListeners());
  }
  return audio;
}

function notifyListeners() {
  const state = getState();
  stateListeners.forEach((fn) => {
    try { fn(state); } catch (e) { console.error("[audioEngine] listener error:", e); }
  });
}

export function getState() {
  const a = audio;
  const dur = a ? (isFinite(a.duration) ? a.duration : 0) : 0;
  return {
    isPlaying: a ? !a.paused && !a.ended : false,
    duration: dur,
    currentTime: a ? a.currentTime : 0,
  };
}

export function onStateChange(fn) {
  stateListeners.push(fn);
  return () => {
    stateListeners = stateListeners.filter((f) => f !== fn);
  };
}

export async function load(url) {
  const a = getAudio();
  a.pause();
  a.crossOrigin = "anonymous";
  a.src = url;
  a.currentTime = 0;
  notifyListeners();

  await new Promise((resolve, reject) => {
    const onMeta = () => { cleanup(); resolve(); };
    const onErr = () => {
      console.error("[audioEngine] load error:", url);
      cleanup();
      reject(new Error(`Audio load failed: ${url}`));
    };
    const cleanup = () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onErr);
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onErr);
    a.load();
  });

  notifyListeners();
}

export function play() {
  const a = getAudio();
  if (!a.src) return;
  if (_audioCtx?.state === 'suspended') _audioCtx.resume();
  a.play().catch((e) => console.warn("[audioEngine] play blocked:", e.message));
}

export function pause() {
  if (!audio) return;
  audio.pause();
}

export function stop() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  notifyListeners();
}

export function seek(seconds) {
  if (!audio) return;
  audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
  notifyListeners();
}

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (audio) audio.volume = _volume;
}

export function getVolume() {
  return _volume;
}

export function isLoaded() {
  return !!(audio && audio.src && audio.readyState >= 1);
}

// Creates/resumes the shared AudioContext inside user gesture scope.
// Must be called from a click handler so the context starts RUNNING, not suspended.
// useAudioAnalyzer reads this same context via getAudioContext() — sharing prevents
// the "new context created outside gesture scope → suspended → silence" bug.
export function prewarm() {
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  }
  if (_audioCtx?.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
}

// Returns the shared AudioContext singleton for the live FFT side-chain tap.
// useAudioAnalyzer uses this instead of creating its own context, ensuring
// createMediaElementSource routes audio through an already-running context.
export function getAudioContext() {
  return _audioCtx;
}

// Not used — waveform-driven meters in useAudioAnalyzer.js don't need this.
export function getAnalyser() {
  return null;
}

// Returns the module-level HTMLAudioElement singleton, or null if not yet created.
// Used by useAudioAnalyzer's live FFT side-chain tap (createMediaElementSource).
export function getAudioElement() {
  return audio;
}

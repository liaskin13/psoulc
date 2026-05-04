// Streaming audio engine using HTMLAudioElement
// Streams audio while playing — works with large files (900MB+)

let audio = null;
let _volume = 0.85;
let stateListeners = [];

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
  stateListeners.forEach((fn) => fn(state));
}

export function getState() {
  const a = audio;
  const dur = a ? (isFinite(a.duration) ? a.duration : 0) : 0;
  if (a && a.src) {
    console.log("[audioEngine] getState:", {
      src: a.src.substring(a.src.lastIndexOf("/") + 1),
      duration: a.duration,
      isFinite: isFinite(a.duration),
      returned: dur,
      readyState: a.readyState,
    });
  }
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
  a.src = url;
  a.currentTime = 0;
  notifyListeners();

  await new Promise((resolve, reject) => {
    const onMeta = () => {
      console.log("[audioEngine] loadedmetadata:", {
        duration: a.duration,
        readyState: a.readyState,
        src: url.substring(url.lastIndexOf("/") + 1),
      });
      cleanup();
      resolve();
    };
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

  console.log("[audioEngine] after await, duration:", a.duration);
  notifyListeners();
}

export function play() {
  const a = getAudio();
  if (!a.src) return;
  a.play().catch(() => {});
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

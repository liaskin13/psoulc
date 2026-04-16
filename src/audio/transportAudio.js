// ── TRANSPORT AUDIO ENGINE ────────────────────────────────────────────────
// Drives the Studer Transport Bar audio playback.
// Uses Web Audio API oscillators to simulate a BPM-synced tone generator
// (since we don't have real audio files). The tone pitch changes with varispeed.
//
// In production, replace the oscillator with an AudioBufferSourceNode
// connected to actual audio file buffers.

let _transportSource = null;
let _transportGain   = null;
let _transportOsc    = null;
let _currentBpm      = 98;
let _currentPitch    = 1.0;
let _isPlaying       = false;

// ── Shared AudioContext getter (re-exported for transport use) ────────────
// We keep this here since transportAudio.js needs its own reference.
function _getCtx() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch (_) { return null; }
}

let _ctx = null;
function ctx() {
  if (!_ctx || _ctx.state === 'closed') _ctx = _getCtx();
  if (_ctx?.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

// BPM → fundamental frequency mapping
// Maps the track's BPM to a subtle ambient tone that plays during transport
function bpmToHz(bpm, pitch) {
  // Base: 528Hz (Venus/Sol frequency) at 120 BPM
  // Scale by BPM ratio and pitch multiplier
  return 528 * (bpm / 120) * pitch;
}

export function transportPlay(bpm = 98, pitchMultiplier = 1.0) {
  try {
    if (_isPlaying) transportStop();
    const c = ctx();
    if (!c) return;
    _isPlaying = true;
    _currentBpm   = bpm;
    _currentPitch = pitchMultiplier;

    _transportOsc  = c.createOscillator();
    _transportGain = c.createGain();

    const hz = bpmToHz(bpm, pitchMultiplier);
    _transportOsc.frequency.value = hz;
    _transportOsc.type = 'sine';

    // Very subtle — this is background atmosphere, not music
    _transportGain.gain.setValueAtTime(0, c.currentTime);
    _transportGain.gain.linearRampToValueAtTime(0.015, c.currentTime + 0.3);

    _transportOsc.connect(_transportGain);
    _transportGain.connect(c.destination);
    _transportOsc.start();
  } catch (_) {}
}

export function transportStop() {
  try {
    if (!_isPlaying) return;
    _isPlaying = false;
    if (_transportGain && _ctx) {
      _transportGain.gain.cancelScheduledValues(_ctx.currentTime);
      _transportGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 0.15);
    }
    const osc = _transportOsc;
    setTimeout(() => {
      try { osc?.stop(); } catch (_) {}
    }, 200);
    _transportOsc  = null;
    _transportGain = null;
  } catch (_) {}
}

// Rewind: pitch audibly drops and rises (tape deck seeking)
export function transportRewind(bpm = 98) {
  try {
    transportStop();
    const c = ctx();
    if (!c) return;

    const osc  = c.createOscillator();
    const gain = c.createGain();
    const now  = c.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(bpmToHz(bpm, 2.0), now);
    osc.frequency.linearRampToValueAtTime(bpmToHz(bpm, 0.25), now + 1.0);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  } catch (_) {}
}

// Fast forward: pitch rises sharply (tape spool speeding up)
export function transportFastForward(bpm = 98) {
  try {
    transportStop();
    const c = ctx();
    if (!c) return;

    const osc  = c.createOscillator();
    const gain = c.createGain();
    const now  = c.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bpmToHz(bpm, 0.5), now);
    osc.frequency.linearRampToValueAtTime(bpmToHz(bpm, 3.0), now + 0.8);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  } catch (_) {}
}

// Varispeed: update the running oscillator's frequency in real time
export function transportPitchChange(pitchMultiplier) {
  try {
    if (!_isPlaying || !_transportOsc || !_ctx) return;
    _currentPitch = pitchMultiplier;
    const hz = bpmToHz(_currentBpm, pitchMultiplier);
    _transportOsc.frequency.linearRampToValueAtTime(hz, _ctx.currentTime + 0.1);
  } catch (_) {}
}

export function isTransportPlaying() {
  return _isPlaying;
}

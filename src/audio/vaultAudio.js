// ── VAULT AUDIO ENGINE ────────────────────────────────────────────────────
// 70s studio-authentic audio effects for the vault interior.
// All functions fail gracefully if Web Audio API is blocked.

// Shared audio context — one per session to avoid clutter
let _ctx = null;
function getCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ── TAPE HISS ──────────────────────────────────────────────────────────────
// Pink noise approximation via white noise + cascading lowpass filters.
// Sounds like a 2" tape machine rolling at low input level.
//
// Returns a stop() function. Call it to fade out the hiss.
let _hissGain = null;
let _hissSource = null;

export function startTapeHiss() {
  try {
    const ctx = getCtx();

    // If hiss is already running, just unmute
    if (_hissSource && _hissGain) {
      _hissGain.gain.cancelScheduledValues(ctx.currentTime);
      _hissGain.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.25);
      return;
    }

    // Generate a 2-second white noise buffer
    const bufferSize   = ctx.sampleRate * 2;
    const noiseBuffer  = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData    = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Paul Kellet's pink noise algorithm (accurate to ±1dB)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      noiseData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    _hissSource = ctx.createBufferSource();
    _hissSource.buffer = noiseBuffer;
    _hissSource.loop   = true;

    // Shape the noise spectrum — tape hiss peaks around 4-8kHz
    const highPass = ctx.createBiquadFilter();
    highPass.type      = 'highpass';
    highPass.frequency.value = 1200;
    highPass.Q.value   = 0.5;

    const bandPass = ctx.createBiquadFilter();
    bandPass.type      = 'bandpass';
    bandPass.frequency.value = 5500;
    bandPass.Q.value   = 0.7;

    _hissGain = ctx.createGain();
    _hissGain.gain.setValueAtTime(0, ctx.currentTime);
    _hissGain.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.3);

    _hissSource.connect(highPass);
    highPass.connect(bandPass);
    bandPass.connect(_hissGain);
    _hissGain.connect(ctx.destination);
    _hissSource.start();
  } catch (_) { /* Audio blocked */ }
}

export function stopTapeHiss() {
  try {
    if (!_hissGain || !_ctx) return;
    const ctx = _ctx;
    _hissGain.gain.cancelScheduledValues(ctx.currentTime);
    _hissGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    const src = _hissSource;
    setTimeout(() => {
      try { src?.stop(); } catch (_) {}
      _hissSource = null;
      _hissGain   = null;
    }, 500);
  } catch (_) {}
}

// ── GRANULAR PITCH-DOWN ────────────────────────────────────────────────────
// Triggered when a void / spaghettification begins.
// A complex tone starts at mid-pitch and slides down to near-silence,
// simulating tape being slowed and pulled into the void.
//
// duration: 1.8s to match spaghettification animation
export function playGranularPitchDown() {
  try {
    const ctx  = getCtx();
    const now  = ctx.currentTime;
    const dur  = 1.8;

    // Primary descending tone
    const osc1  = ctx.createOscillator();
    const osc2  = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(220, now);
    osc1.frequency.exponentialRampToValueAtTime(12, now + dur);

    osc2.frequency.setValueAtTime(330, now);
    osc2.frequency.exponentialRampToValueAtTime(8, now + dur);

    gain1.gain.setValueAtTime(0.045, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    gain2.gain.setValueAtTime(0.025, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.2);

    // Waveshaper for granular distortion character
    const waveshaper = ctx.createWaveShaper();
    const curveLen   = 256;
    const curve      = new Float32Array(curveLen);
    for (let i = 0; i < curveLen; i++) {
      const x = (i * 2) / curveLen - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    waveshaper.curve = curve;

    osc1.connect(waveshaper);
    waveshaper.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.1);
    osc2.stop(now + dur + 0.3);
  } catch (_) {}
}

// ── 528Hz HOVER GLOW ───────────────────────────────────────────────────────
// Brief crystalline 528Hz tone when hovering over a record (per directive).
// Short envelope — just a hint of frequency, not a sustained tone.
export function play528HzGlow() {
  try {
    const ctx  = getCtx();
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 528;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.08);
    gain.gain.setValueAtTime(0.028, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  } catch (_) {}
}

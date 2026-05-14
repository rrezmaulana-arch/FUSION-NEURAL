// src/hooks/useAgentAudio.ts — Immersive Audio (Web Audio API, no external files)
type SoundType = 'godMode' | 'godModeOff' | 'agentActivate' | 'footstep' | 'layerSwitch' | 'expGain';

let _ctx: AudioContext | null = null;
let _muted = false;

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function osc(ctx: AudioContext, freq: number, type: OscillatorType, dur: number, vol: number, delay = 0) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  g.gain.setValueAtTime(0, ctx.currentTime + delay);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
  o.start(ctx.currentTime + delay);
  o.stop(ctx.currentTime + delay + dur + 0.05);
}

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  godMode: (ctx) => {
    [220, 330, 440, 660, 880].forEach((f, i) => { osc(ctx, f, 'sawtooth', 0.7, 0.07, i * 0.06); });
    osc(ctx, 55, 'sine', 1.0, 0.12);
  },
  godModeOff: (ctx) => {
    [880, 660, 440, 220].forEach((f, i) => { osc(ctx, f, 'triangle', 0.3, 0.04, i * 0.05); });
  },
  agentActivate: (ctx) => {
    osc(ctx, 440, 'sine', 0.15, 0.09);
    osc(ctx, 660, 'sine', 0.25, 0.07, 0.08);
  },
  footstep: (ctx) => {
    // Sci-fi telemetry data tick (halus, tidak mengganggu)
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(2400, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.1);
  },
  layerSwitch: (ctx) => {
    osc(ctx, 528, 'sine', 0.2, 0.06);
    osc(ctx, 660, 'sine', 0.15, 0.05, 0.1);
  },
  expGain: (ctx) => {
    osc(ctx, 880, 'sine', 0.1, 0.06);
    osc(ctx, 1320, 'sine', 0.15, 0.04, 0.08);
  },
};

export function useAgentAudio() {
  const play = (sound: SoundType) => {
    try {
      const ctx = getCtx();
      if (ctx) SOUNDS[sound]?.(ctx);
    } catch { /* silent fail */ }
  };
  const toggleMute = () => { _muted = !_muted; return _muted; };
  const isMuted = () => _muted;
  return { play, toggleMute, isMuted };
}

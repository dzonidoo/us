// The background song, played the way an app plays its own sound rather than
// as media: through Web Audio, not an <audio> element. That keeps iOS from
// treating it as "Now Playing" (no lock-screen / Dynamic Island player), and
// like app sound it follows the ring/silent switch.
//
// iOS only lets sound start, or resume, from a tap (on touchend / click, not
// pointerdown), and after the app has been in the background it often won't
// resume without one, or its audio gets stuck ("interrupted") altogether. So:
//  - `prime()` must run synchronously inside a tap: it creates and resumes the
//    audio context there, which keeps it allowed to play later;
//  - whenever the song should be playing but iOS has it stopped, the next tap
//    anywhere resumes it, rebuilding the audio context if it's stuck.
//
// Not a hook: the song has to survive navigation between screens.

import { fetchDecrypted } from "./vault";

const MUTED_KEY = "us:muted";
// Background music: well below full volume.
const VOLUME = 0.5;
// Long enough not to click when it starts or stops.
const FADE_S = 1;
// Only the first part of the song loops, up to here. Each pass fades out at
// its end and the next fades in, starting just before the old one is gone.
const LOOP_END_S = 62;
const LOOP_FADE_OUT_S = 3;
const LOOP_FADE_IN_S = 3;
const LOOP_OVERLAP_S = 1;

// Equal-power curves (the usual crossfade shape): a fade-out holds its loudness
// and drops towards the end, a fade-in rises early, so the turn has no dip.
function fadeCurve(direction: "in" | "out", steps = 128): Float32Array {
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    curve[i] = direction === "out" ? Math.cos((t * Math.PI) / 2) : Math.sin((t * Math.PI) / 2);
  }
  return curve;
}

let ctx: AudioContext | null = null;
let gain: GainNode | null = null; // master volume: mute and fades
let song: Promise<AudioBuffer | null> | null = null;
let buffer: AudioBuffer | null = null; // decoded once; usable in any context
let playing = false; // the song should be playing (started and not muted)
let loop = 0; // bumped when the loop restarts, so an old loop's queued passes stop
const listeners = new Set<() => void>();

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

const isRunning = () => ctx?.state === "running";
// "interrupted" is iOS-only, so it's not in the TypeScript types.
const isStuck = () => !ctx || ctx.state === "closed" || (ctx.state as string) === "interrupted";

/** Call synchronously in a tap handler, before any await. */
export function prime() {
  if (isMuted()) return;
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioContext();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    ctx.onstatechange = onStateChange;
  }
  // Same function each time, so adding it again (after a rebuild) is a no-op.
  document.addEventListener("visibilitychange", onVisibility);
  void ctx.resume();
}

function fadeTo(volume: number) {
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(volume, now + FADE_S);
}

/** Start the song (if not muted and primed by a tap). Safe to call more than once. */
export async function startMusic() {
  if (isMuted() || !ctx) return;
  song ??= fetchDecrypted("music.bin")
    .then((bytes) => ctx!.decodeAudioData(bytes.slice().buffer))
    .catch(() => null); // no song in this data set
  buffer = await song;
  if (!buffer || isMuted() || !ctx) return;
  if (!playing) {
    playing = true;
    startLoop();
  }
  await ctx.resume().catch(() => {});
  if (isRunning()) fadeTo(VOLUME);
  else resumeOnNextTap();
}

function startLoop() {
  if (!ctx || !buffer) return;
  loop++;
  playPass(buffer, ctx.currentTime + 0.05, false, loop);
}

/**
 * One pass of the loop, from the start to LOOP_END_S, on its own volume: it
 * fades out at the end and the next pass starts LOOP_OVERLAP_S before it's over.
 * The first pass starts at full volume; the master fade already eases it in.
 */
function playPass(buffer: AudioBuffer, start: number, fadeIn: boolean, ofLoop: number) {
  if (!ctx || !gain || ofLoop !== loop) return;
  const length = Math.min(LOOP_END_S, buffer.duration);
  const end = start + length;

  const volume = ctx.createGain();
  volume.connect(gain);
  if (fadeIn) volume.gain.setValueCurveAtTime(fadeCurve("in"), start, LOOP_FADE_IN_S);
  else volume.gain.setValueAtTime(1, start);
  volume.gain.setValueCurveAtTime(fadeCurve("out"), end - LOOP_FADE_OUT_S, LOOP_FADE_OUT_S);

  const pass = ctx.createBufferSource();
  pass.buffer = buffer;
  pass.connect(volume);
  pass.onended = () => volume.disconnect();
  pass.start(start, 0, length);

  // Queue the next pass a little ahead of time, on the audio clock (so it stays
  // in step while the song is paused in the background).
  const cue = ctx.createConstantSource();
  cue.offset.value = 0; // silent; connected only so Safari keeps it (and its onended) alive
  cue.connect(ctx.destination);
  cue.onended = () => {
    cue.disconnect();
    playPass(buffer, end - LOOP_OVERLAP_S, true, ofLoop);
  };
  cue.start();
  cue.stop(end - LOOP_OVERLAP_S - 1);
}

// --- Staying alive on iOS ---

const TAP_EVENTS = ["touchend", "click"] as const;
let waitingForTap = false;

/** The song should play but can't yet: pick it up on the next tap anywhere. */
function resumeOnNextTap() {
  if (waitingForTap) return;
  waitingForTap = true;
  for (const e of TAP_EVENTS) document.addEventListener(e, onTap, { capture: true });
}

function onTap() {
  waitingForTap = false;
  for (const e of TAP_EVENTS) document.removeEventListener(e, onTap, { capture: true });
  if (isMuted()) return;
  if (isStuck()) {
    // iOS won't bring this context back: start a new one, right here in the tap.
    const old = ctx;
    ctx = null;
    void old?.close().catch(() => {});
    prime();
    if (playing) {
      startLoop();
      fadeTo(VOLUME);
    } else void startMusic();
    return;
  }
  prime();
  if (!playing) void startMusic();
  else fadeTo(VOLUME);
}

/** Opened with a remembered key there was no tap yet: the song starts on the first one. */
export function startOnFirstTap() {
  if (!isMuted()) resumeOnNextTap();
}

function onStateChange() {
  if (!document.hidden && playing && !isMuted() && !isRunning()) resumeOnNextTap();
}

/** In the background the song pauses; on return it resumes, or waits for a tap if iOS won't allow it. */
function onVisibility() {
  if (!ctx || !playing || isMuted()) return;
  if (document.hidden) {
    void ctx.suspend();
    return;
  }
  void ctx.resume().catch(() => {});
  setTimeout(() => {
    if (!document.hidden && !isRunning()) resumeOnNextTap();
  }, 300);
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    // Not remembered, but still applies now.
  }
  if (muted) {
    fadeTo(0);
    setTimeout(() => isMuted() && ctx?.suspend(), FADE_S * 1000);
  } else {
    onTap(); // the tap on the switch counts: resumes, or starts the song
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

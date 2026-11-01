/** The two alert tones the app can request. */
export type AlertLevel = 'WARNING' | 'DANGER';

let audioCtx: AudioContext | null = null;
let activeOscillator: OscillatorNode | null = null;

export function _resetAudioContext(): void {
  audioCtx = null;
  activeOscillator = null;
}

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    // webkitAudioContext is Safari's legacy spelling; it is not in the standard
    // DOM types, so the one cast lives here instead of at every call site.
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAlertBeep(level: AlertLevel = 'WARNING', isMuted = false): void {
  if (isMuted) {
    return;
  }

  stopAlertBeep();

  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = level === 'DANGER' ? 880 : 440;

  // Simple envelope to avoid clicking
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0.01, now);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  activeOscillator = oscillator;
}

export function stopAlertBeep(): void {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch {
      // Ignore if already stopped/disconnected
    }
    activeOscillator = null;
  }
}

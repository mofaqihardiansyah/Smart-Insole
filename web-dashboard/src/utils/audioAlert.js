let audioCtx = null;
let activeOscillator = null;

export function _resetAudioContext() {
  audioCtx = null;
  activeOscillator = null;
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAlertBeep(level = 'WARNING', isMuted = false) {
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

export function stopAlertBeep() {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch (e) {
      // Ignore if already stopped/disconnected
    }
    activeOscillator = null;
  }
}

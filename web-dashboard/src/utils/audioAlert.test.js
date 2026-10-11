import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playAlertBeep, stopAlertBeep, _resetAudioContext } from './audioAlert';

describe('audioAlert', () => {
  let mockAudioContextInstance;
  let mockOscillator;
  let mockGainNode;
  let AudioContextMock;

  beforeEach(() => {
    vi.useFakeTimers();
    _resetAudioContext();

    mockOscillator = {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        value: 1,
      },
      connect: vi.fn(),
    };

    mockAudioContextInstance = {
      currentTime: 0,
      state: 'running',
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGainNode),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    AudioContextMock = vi.fn(() => mockAudioContextInstance);
    vi.stubGlobal('AudioContext', AudioContextMock);
    vi.stubGlobal('webkitAudioContext', AudioContextMock);
  });

  afterEach(() => {
    stopAlertBeep();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not create AudioContext or play audio when isMuted is true', () => {
    playAlertBeep('WARNING', true);
    expect(AudioContextMock).not.toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
  });

  it('plays WARNING beep (440Hz tone) when not muted', () => {
    playAlertBeep('WARNING', false);
    expect(AudioContextMock).toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.frequency.value).toBe(440);
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('plays DANGER beep (880Hz tone) when not muted', () => {
    playAlertBeep('DANGER', false);
    expect(AudioContextMock).toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.frequency.value).toBe(880);
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('stops active alert beeps correctly', () => {
    playAlertBeep('WARNING', false);
    expect(mockOscillator.start).toHaveBeenCalled();
    
    stopAlertBeep();
    expect(mockOscillator.stop).toHaveBeenCalled();
  });
});

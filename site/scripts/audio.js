// site/scripts/audio.js
// Procedural Web Audio API sound synthesizer - zero external audio assets needed!

let audioCtx = null;
let isMuted = true;

// Initialize sound preference from localStorage
try {
    const saved = localStorage.getItem('goved_sound_enabled');
    if (saved === 'true') {
        isMuted = false;
    }
} catch (e) {
    // localStorage might be disabled
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

export function toggleSound() {
    isMuted = !isMuted;
    try {
        localStorage.setItem('goved_sound_enabled', (!isMuted).toString());
    } catch (e) {}
    
    if (!isMuted) {
        // Play a cheerful chirp when unmuting
        playJuggleSound(1);
    }
    return !isMuted;
}

export function isSoundEnabled() {
    return !isMuted;
}

export function setSoundEnabled(enabled) {
    isMuted = !enabled;
    try {
        localStorage.setItem('goved_sound_enabled', enabled.toString());
    } catch (e) {}
}

/**
 * Play a bounce sound with frequency mapped to collision speed
 */
export function playBounceSound(intensity = 1) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const clampedIntensity = Math.min(Math.max(intensity, 0.2), 3.0);
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const startFreq = 120 + clampedIntensity * 70;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    gain.gain.setValueAtTime(0.15 * Math.min(clampedIntensity, 1.5), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
}

/**
 * Play a satisfying musical ping when a ball is juggled/hit.
 * Musical notes ascend with combo streak!
 */
const PENTATONIC_SCALE = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50 // C6
];

export function playJuggleSound(combo = 1) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const noteIndex = Math.min(combo - 1, PENTATONIC_SCALE.length - 1);
    const baseFreq = PENTATONIC_SCALE[Math.max(0, noteIndex)];
    const now = ctx.currentTime;

    // Harmonic marimba / chime ping
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);

    // Subtle overtone
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);

    const duration = 0.22;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
}

/**
 * Play a victorious 3-note arpeggio when a high score is broken
 */
export function playHighScoreSound() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * 0.08;
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.26);
    });
}

/**
 * Play Guy character action chirp
 */
export function playGuySound(action = 'jump') {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (action === 'save') {
        // High energetic sweep
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
        // Normal jump chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
}

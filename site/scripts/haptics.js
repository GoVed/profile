// site/scripts/haptics.js
// Advanced multi-tier haptic feedback engine for mobile web browsers

let hapticsEnabled = true;

/**
 * Trigger physical vibration pattern if supported on the device
 */
function vibrate(pattern) {
    if (!hapticsEnabled) return false;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
            const p = Array.isArray(pattern) ? pattern : [pattern];
            return navigator.vibrate(p);
        } catch (e) {
            console.warn('Haptic trigger error:', e);
            return false;
        }
    }
    return false;
}

export const Haptics = {
    // Ultra light mechanical click (for keyboard keys, chips, menu items)
    light: () => vibrate([40]),

    // Crisp medium pop (ball juggle, toggle button, HUD actions)
    medium: () => vibrate([65]),

    // Solid heavy thud (ground bounce, strong smash)
    heavy: () => vibrate([90, 40, 90]),

    // Escalating rhythmic juggle combo
    combo: (streak = 1) => {
        const duration = Math.min(40 + (streak * 8), 120);
        if (streak % 5 === 0) {
            vibrate([duration, 40, duration + 40]);
        } else {
            vibrate([duration]);
        }
    },

    // Guy character save / header
    guySave: () => vibrate([50, 40, 90]),

    // Guy clicked / celebrated
    guyCelebration: () => vibrate([45, 35, 45, 35, 60]),

    // Gravity warp sensation (switch between Earth / Zero-G / Antigravity)
    gravityShift: () => vibrate([70, 50, 40, 50, 100]),

    // High score / victory fanfare rumble
    highScore: () => vibrate([60, 50, 70, 50, 90, 60, 120]),

    // Successful command execution (e.g. hire)
    success: () => vibrate([45, 60, 70]),

    // Error / typo warning buzz
    error: () => vibrate([90, 60, 90, 60, 110]),

    // Matrix digital rain pulse
    matrix: () => vibrate([35, 40, 35, 40, 50]),

    // Test pulse
    test: () => vibrate([120, 60, 120]),

    // Toggle haptics
    toggle: () => {
        hapticsEnabled = !hapticsEnabled;
        if (hapticsEnabled) vibrate([60]);
        return hapticsEnabled;
    },

    isEnabled: () => hapticsEnabled,
    isSupported: () => (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function')
};

// Global window binding
if (typeof window !== 'undefined') {
    window.Haptics = Haptics;
}

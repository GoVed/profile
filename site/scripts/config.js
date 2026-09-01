// site/scripts/config.js

export const ballConfig = {
    radius: 24,
    gravity: 0.42,
    damping: 0.88,
    threshold: 0.05,
    friction: 0.015,
    sensitivity: 2.5,
    maxSpeed: 28,
    juggleImpulseY: -13.5,
    juggleImpulseXMax: 7.0,
    colors: [
        { primary: '#ff6600', glow: 'rgba(255, 102, 0, 0.4)' },
        { primary: '#00e5ff', glow: 'rgba(0, 229, 255, 0.4)' },
        { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
        { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
        { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
        { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }
    ]
};

export const guyConfig = {
    speed: 1.35,
    ballSlowThreshold: 1.0,
    throwImpulseY: 11.2,
    throwImpulseX: 4.5,
    jumpStrength: 7.0,
    jumpChance: 0.01,
    blinkChance: 0.02,
    // Chibi Proportions
    headRadius: 10,
    bodyWidth: 15,
    bodyHeight: 18,
    legLength: 12,
    legWidth: 4,
    armLength: 11,
    armWidth: 3.5,
    shoulderYOffset: 3,
    // Animation
    animSpeed: 12,
    idleAnimSpeed: 70,
    idleAnimMaxFrames: 8,
    headTiltAngle: Math.PI / 18,
    armSwingMaxAngle: Math.PI / 5,
    idleRestAngle: Math.PI / 20,
};
guyConfig.totalHeight = (guyConfig.headRadius * 2) + guyConfig.bodyHeight + guyConfig.legLength;

export const gameConfig = {
    pointsPerHit: 10,
    guySaveBonus: 50,
    comboMultiplierStep: 0.5, // combo 1=1x, 2=1.5x, 3=2x, 4=2.5x, etc.
    maxBalls: 8,
    gravityOptions: [
        { label: 'Normal 1G', value: 1.0, icon: '🌍' },
        { label: 'Zero 0G', value: 0.0, icon: '🛸' },
        { label: 'Antigravity -1G', value: -1.0, icon: '🪐' }
    ]
};

export const canvasConfig = {
    bottomPadding: 25,
    profileText: "An AI enthusiast who likes to build games. Chasing the butterfly of curiosity everyday. \n Something interesting? Day=Gone!"
};

// scripts/config.js
export const ballConfig = {
    radius: 25,
    gravity: 0.1,
    damping: 0.9,
    threshold: 0.1,
    friction: 0.01,
};

export const guyConfig = {
    speed: 0.6,
    ballSlowThreshold: 0.5,
    throwImpulseY: 7,
    throwImpulseX: 3,
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
    idleAnimMaxFrames: 5,
    headTiltAngle: Math.PI / 18,
    armSwingMaxAngle: Math.PI / 5, // Original value from context
    idleRestAngle: Math.PI / 20,
};
// Calculate totalHeight based on other properties
guyConfig.totalHeight = (guyConfig.headRadius * 2) + guyConfig.bodyHeight + guyConfig.legLength;


export const canvasConfig = {
    bottomPadding: 25,
    profileText: "An AI enthusiast who likes to build games. Chasing the butterfly of curosity everyday. \n Something interesting? Day=Gone!"
};
// site/scripts/bulb.js
// High-performance Edison bulb with soft ambient lighting and realistic penumbra shadow rendering

import { canvasConfig } from './config';

export const bulbState = {
    anchorX: 0,
    anchorY: 0,
    x: 0,
    y: 38,
    cordLength: 38,
    angle: 0,
    angleVel: 0,
    isLit: true,
    brightness: 1.0
};

/**
 * Initializes or updates bulb anchor when canvas dimensions change
 */
export function initBulb(virtualWidth) {
    bulbState.anchorX = virtualWidth / 2;
    bulbState.anchorY = 0;
    bulbState.cordLength = Math.min(45, Math.max(30, virtualWidth * 0.05));
    updateBulbPosition();
}

/**
 * Updates pendulum physics for the hanging bulb
 */
export function updateBulbPhysics(timeStepFactor) {
    const gravity = 0.05;
    const restoringTorque = -(gravity / bulbState.cordLength) * Math.sin(bulbState.angle);
    
    bulbState.angleVel += restoringTorque * timeStepFactor;
    bulbState.angleVel *= Math.pow(0.988, timeStepFactor);
    bulbState.angle += bulbState.angleVel * timeStepFactor;

    if (bulbState.angle > 1.0) { bulbState.angle = 1.0; bulbState.angleVel *= -0.5; }
    if (bulbState.angle < -1.0) { bulbState.angle = -1.0; bulbState.angleVel *= -0.5; }

    updateBulbPosition();
    bulbState.brightness = bulbState.isLit ? 1.0 : 0.0;
}

function updateBulbPosition() {
    bulbState.x = bulbState.anchorX + Math.sin(bulbState.angle) * bulbState.cordLength;
    bulbState.y = bulbState.anchorY + Math.cos(bulbState.angle) * bulbState.cordLength;
}

/**
 * Check if a point is near the bulb (for click / tap interaction)
 */
export function isPointNearBulb(px, py) {
    const dx = px - bulbState.x;
    const dy = py - bulbState.y;
    return Math.sqrt(dx * dx + dy * dy) < 28;
}

/**
 * Apply impulse to swing the bulb
 */
export function nudgeBulb(impulse = 0.08) {
    bulbState.angleVel += impulse;
}

/**
 * Toggles bulb light state
 */
export function toggleBulbLight() {
    bulbState.isLit = !bulbState.isLit;
    return bulbState.isLit;
}

/**
 * Draws ultra-fast, smooth ambient lighting from the bulb (zero banding & zero 240Hz frame drops)
 */
export function drawAmbientLight(ctx, canvasDim) {
    if (!bulbState.isLit) return;

    ctx.save();
    
    // Smooth localized pool of warm light around bulb area (ultra fast)
    const lightRadius = Math.min(canvasDim.width * 0.8, 550);
    const glowGrad = ctx.createRadialGradient(
        bulbState.x, bulbState.y, 4,
        bulbState.x, bulbState.y, lightRadius
    );

    glowGrad.addColorStop(0, 'rgba(255, 235, 175, 0.16)');
    glowGrad.addColorStop(0.18, 'rgba(255, 215, 135, 0.09)');
    glowGrad.addColorStop(0.45, 'rgba(255, 195, 100, 0.035)');
    glowGrad.addColorStop(0.8, 'rgba(255, 180, 70, 0.008)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(bulbState.x, bulbState.y, lightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright bulb halo
    const innerBloom = ctx.createRadialGradient(
        bulbState.x, bulbState.y, 1,
        bulbState.x, bulbState.y, 90
    );
    innerBloom.addColorStop(0, 'rgba(255, 245, 200, 0.32)');
    innerBloom.addColorStop(0.4, 'rgba(255, 210, 110, 0.10)');
    innerBloom.addColorStop(1, 'rgba(255, 180, 50, 0)');
    
    ctx.fillStyle = innerBloom;
    ctx.beginPath();
    ctx.arc(bulbState.x, bulbState.y, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draws realistic diffuse penumbra shadows with pure black cores (as real bulb area lights produce)
 */
export function drawPureBlackShadows(ctx, balls, guyState, canvasDim) {
    const groundLevel = canvasDim.height - canvasConfig.bottomPadding;
    const light = bulbState;

    ctx.save();

    // 1. Draw soft penumbra shadows for balls
    for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const dy = b.y - light.y;

        // --- Background Wall Shadow (soft diffuse silhouette behind floating ball) ---
        const depth = 0.22;
        const wallShadowX = b.x + (b.x - light.x) * depth;
        const wallShadowY = b.y + (b.y - light.y) * depth;
        const wallRadius = b.radius * (1 + depth * 0.5) * Math.max(b.squashX || 1, b.squashY || 1);

        const wallGrad = ctx.createRadialGradient(
            wallShadowX, wallShadowY, 0,
            wallShadowX, wallShadowY, wallRadius
        );
        wallGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        wallGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.25)');
        wallGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.ellipse(wallShadowX, wallShadowY, wallRadius, wallRadius * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = wallGrad;
        ctx.fill();

        // --- Ground Plane Perspective Shadow with Soft Penumbra Falloff ---
        if (dy > 4) {
            const t = (groundLevel - light.y) / dy;
            const groundShadowX = light.x + (b.x - light.x) * t;
            const distToGround = Math.max(0, groundLevel - (b.y + b.radius));
            
            // Higher above ground -> wider, softer, more diffuse penumbra
            const spread = 1 + (distToGround / 180);
            const shadowW = Math.max(6, b.radius * spread * 1.3 * (1 + Math.abs(b.x - light.x) / (canvasDim.width * 0.6)));
            const shadowH = Math.max(2, b.radius * 0.35 * Math.max(0.4, 1 - (distToGround / 500)));

            const coreOpacity = Math.min(0.9, 0.35 + Math.max(0, 1 - (distToGround / 250)) * 0.55);
            
            const groundGrad = ctx.createRadialGradient(
                groundShadowX, groundLevel, 0,
                groundShadowX, groundLevel, shadowW
            );
            // Pure black core fading smoothly out into diffuse penumbra
            groundGrad.addColorStop(0, `rgba(0, 0, 0, ${coreOpacity})`);
            groundGrad.addColorStop(0.35, `rgba(0, 0, 0, ${(coreOpacity * 0.6).toFixed(3)})`);
            groundGrad.addColorStop(0.75, `rgba(0, 0, 0, ${(coreOpacity * 0.18).toFixed(3)})`);
            groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.ellipse(groundShadowX, groundLevel + 1, shadowW, shadowH, 0, 0, Math.PI * 2);
            ctx.fillStyle = groundGrad;
            ctx.fill();
        }
    }

    // 2. Draw soft penumbra shadow for Chibi Guy
    if (guyState) {
        const guyX = guyState.x || (canvasDim.width / 2);
        const guyY = guyState.y || (groundLevel - 20);
        const guyDy = guyY - light.y;

        // Background wall shadow for Guy
        const guyDepth = 0.18;
        const guyWallX = guyX + (guyX - light.x) * guyDepth;
        const guyWallY = guyY + (guyY - light.y) * guyDepth;
        
        const guyWallGrad = ctx.createRadialGradient(
            guyWallX, guyWallY, 0,
            guyWallX, guyWallY, 26
        );
        guyWallGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        guyWallGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
        guyWallGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.ellipse(guyWallX, guyWallY, 24, 28, 0, 0, Math.PI * 2);
        ctx.fillStyle = guyWallGrad;
        ctx.fill();

        // Ground shadow for Guy
        if (guyDy > 4) {
            const t = (groundLevel - light.y) / guyDy;
            const guyGroundX = light.x + (guyX - light.x) * t;

            const guyGroundGrad = ctx.createRadialGradient(
                guyGroundX, groundLevel, 0,
                guyGroundX, groundLevel, 28
            );
            guyGroundGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
            guyGroundGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.35)');
            guyGroundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.ellipse(guyGroundX, groundLevel + 1, 28, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = guyGroundGrad;
            ctx.fill();
        }
    }

    ctx.restore();
}

/**
 * Draws the hanging lamp cord, metallic socket, glass bulb, and glowing filament
 */
export function drawHangingBulb(ctx) {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const b = bulbState;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // 1. Hanging cord from ceiling anchor to socket
    ctx.beginPath();
    ctx.moveTo(0, -b.cordLength);
    ctx.lineTo(0, -9);
    ctx.strokeStyle = isDarkMode ? '#777777' : '#222222';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 2. Ceiling anchor rosette
    ctx.beginPath();
    ctx.arc(0, -b.cordLength, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isDarkMode ? '#888888' : '#333333';
    ctx.fill();

    // 3. Brass socket fixture
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-4.5, -9, 9, 7);
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(-5.5, -2, 11, 2.5);

    // 4. Glass bulb shape
    ctx.beginPath();
    ctx.moveTo(-5.5, 0.5);
    ctx.bezierCurveTo(-11, 9, -13, 18, 0, 24);
    ctx.bezierCurveTo(13, 18, 11, 9, 5.5, 0.5);
    ctx.closePath();

    if (b.isLit) {
        const glassGrad = ctx.createRadialGradient(0, 9, 1, 0, 11, 14);
        glassGrad.addColorStop(0, 'rgba(255, 245, 205, 0.88)');
        glassGrad.addColorStop(0.55, 'rgba(255, 205, 110, 0.40)');
        glassGrad.addColorStop(1, 'rgba(255, 170, 50, 0.20)');
        ctx.fillStyle = glassGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 225, 130, 0.75)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 5. Glowing Tungsten Filament
        ctx.beginPath();
        ctx.moveTo(-2.5, 5);
        ctx.lineTo(-1.5, 13);
        ctx.lineTo(0, 9.5);
        ctx.lineTo(1.5, 13);
        ctx.lineTo(2.5, 5);
        ctx.strokeStyle = '#fff2a8';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(0, 11.5, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    } else {
        ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
        ctx.fill();
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-2.5, 5);
        ctx.lineTo(-1.5, 13);
        ctx.lineTo(0, 9.5);
        ctx.lineTo(1.5, 13);
        ctx.lineTo(2.5, 5);
        ctx.strokeStyle = isDarkMode ? '#555555' : '#888888';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Glass specular highlight
    ctx.beginPath();
    ctx.ellipse(-4, 7, 2, 5, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    ctx.restore();
}

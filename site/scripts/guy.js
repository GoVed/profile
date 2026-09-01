// site/scripts/guy.js
import { guyConfig, canvasConfig } from './config';
import { ballState } from './ball'; 

export let guyCharacterState = {
    x: 0,
    y: 0,
    vy: 0,
    state: 'idle', // 'idle', 'following', 'throwing', 'jumping', 'celebrating', 'saving'
    animFrame: 0,
    animTimer: 0,
    facingRight: true,
    idleAnimFrame: 0,
    idleAnimTimer: 0,
    isBlinking: false,
    blinkTimer: 0,
    celebrateTimer: 0,
    saveCooldown: 0,
    emotion: 'normal' // 'normal', 'happy', 'excited', 'shocked'
};

export function initGuy() {
    guyCharacterState.x = guyConfig.bodyWidth / 2 + 10;
    guyCharacterState.y = 0;
    guyCharacterState.vy = 0;
    guyCharacterState.state = 'idle';
    guyCharacterState.animFrame = 0;
    guyCharacterState.idleAnimFrame = 0;
    guyCharacterState.idleAnimTimer = 0;
    guyCharacterState.facingRight = true;
    guyCharacterState.isBlinking = false;
    guyCharacterState.blinkTimer = 0;
    guyCharacterState.celebrateTimer = 0;
    guyCharacterState.saveCooldown = 0;
    guyCharacterState.emotion = 'normal';
}

export function isPointNearGuy(clickX, clickY, canvas) {
    if (!canvas) return false;
    const groundLevel = canvas.height - canvasConfig.bottomPadding;
    const guyY = groundLevel + guyCharacterState.y - guyConfig.totalHeight / 2;
    const dx = clickX - guyCharacterState.x;
    const dy = clickY - guyY;
    return (Math.abs(dx) < guyConfig.bodyWidth * 1.8 && Math.abs(dy) < guyConfig.totalHeight * 1.2);
}

export function triggerGuyAction(action = 'jump') {
    if (action === 'jump' || action === 'click') {
        if (guyCharacterState.y === 0) {
            guyCharacterState.vy = -guyConfig.jumpStrength * 1.2;
            guyCharacterState.state = 'celebrating';
            guyCharacterState.celebrateTimer = 40;
            guyCharacterState.emotion = 'happy';
        }
    } else if (action === 'celebrate') {
        guyCharacterState.state = 'celebrating';
        guyCharacterState.celebrateTimer = 60;
        guyCharacterState.emotion = 'excited';
        if (guyCharacterState.y === 0) {
            guyCharacterState.vy = -guyConfig.jumpStrength;
        }
    }
}

export function updateGuyInteraction(timeStepFactor, canvas, onGuySave = null) {
    const ballSpeed = Math.sqrt(ballState.ax * ballState.ax + ballState.ay * ballState.ay);
    const ballIsEffectivelySlow = ballSpeed < guyConfig.ballSlowThreshold;
    const ballIsOnGround = (ballState.y >= canvas.height - ballState.radius - canvasConfig.bottomPadding - 1);
    const effectiveGuyWidth = guyConfig.bodyWidth;
    const groundLevel = canvas.height - canvasConfig.bottomPadding;

    if (guyCharacterState.saveCooldown > 0) {
        guyCharacterState.saveCooldown -= timeStepFactor;
    }

    // Blink Logic
    if (!guyCharacterState.isBlinking && Math.random() < guyConfig.blinkChance) {
        guyCharacterState.isBlinking = true;
        guyCharacterState.blinkTimer = 5;
    }
    if (guyCharacterState.isBlinking) {
        guyCharacterState.blinkTimer -= timeStepFactor;
        if (guyCharacterState.blinkTimer <= 0) guyCharacterState.isBlinking = false;
    }

    // Physics (Vertical)
    guyCharacterState.y += guyCharacterState.vy * timeStepFactor;
    if (guyCharacterState.y > 0) {
        guyCharacterState.y = 0;
        guyCharacterState.vy = 0;
    } else if (guyCharacterState.y < 0) {
        guyCharacterState.vy += 0.22 * timeStepFactor; // Gravity
    }

    // Clamp guyX to canvas bounds
    guyCharacterState.x = Math.max(effectiveGuyWidth / 2, Math.min(guyCharacterState.x, canvas.width - effectiveGuyWidth / 2));

    // Handle Celebration / Save animation timer
    if (guyCharacterState.celebrateTimer > 0) {
        guyCharacterState.celebrateTimer -= timeStepFactor;
        if (guyCharacterState.celebrateTimer <= 0) {
            guyCharacterState.state = 'idle';
            guyCharacterState.emotion = 'normal';
        }
    }

    // INTERACTIVE AI / SAVE LOGIC:
    // If the ball is falling fast toward the floor near the guy, the guy attempts an energetic header/save!
    const distToBallX = Math.abs(guyCharacterState.x - ballState.x);
    const isBallFallingNearGround = (ballState.ay > 1.2 && ballState.y > groundLevel - 140 && distToBallX < 140);

    if (isBallFallingNearGround && guyCharacterState.saveCooldown <= 0 && guyCharacterState.state !== 'celebrating') {
        guyCharacterState.state = 'following';
        guyCharacterState.facingRight = ballState.x > guyCharacterState.x;
        // Dash faster to catch the falling ball
        const dir = Math.sign(ballState.x - guyCharacterState.x);
        guyCharacterState.x += dir * guyConfig.speed * 1.5 * timeStepFactor;

        // Check for header / kick save
        const distCenter = Math.hypot(guyCharacterState.x - ballState.x, (groundLevel + guyCharacterState.y - guyConfig.totalHeight / 2) - ballState.y);
        if (distCenter < (ballState.radius + guyConfig.totalHeight / 2 + 5)) {
            // GUY SAVE!
            ballState.isGrounded = false;
            ballState.isCeilingGrounded = false;
            ballState.ay = -guyConfig.throwImpulseY * 1.15;
            ballState.ax = (ballState.x - guyCharacterState.x) * 0.4 + (Math.random() - 0.5) * 2;
            ballState.hasBeenHitSinceGround = true;

            guyCharacterState.saveCooldown = 60;
            guyCharacterState.state = 'celebrating';
            guyCharacterState.celebrateTimer = 35;
            guyCharacterState.emotion = 'excited';
            guyCharacterState.vy = -guyConfig.jumpStrength * 0.8;

            if (onGuySave) onGuySave();
            return;
        }
    }

    if (guyCharacterState.state === 'idle') {
        guyCharacterState.animFrame = 0;
        guyCharacterState.idleAnimTimer += timeStepFactor;
        if (guyCharacterState.idleAnimTimer >= guyConfig.idleAnimSpeed) {
            guyCharacterState.idleAnimTimer = 0;
            guyCharacterState.idleAnimFrame = (guyCharacterState.idleAnimFrame + 1) % guyConfig.idleAnimMaxFrames;
        }

        // Random Jump
        if (guyCharacterState.y === 0 && Math.random() < guyConfig.jumpChance) {
            guyCharacterState.vy = -guyConfig.jumpStrength;
        }

        if (ballIsEffectivelySlow && ballIsOnGround && Math.abs(ballState.ax) < guyConfig.ballSlowThreshold / 2 && timeStepFactor > 0) {
            guyCharacterState.state = 'following';
            guyCharacterState.idleAnimFrame = 0;
        }
    } else if (guyCharacterState.state === 'following') {
        guyCharacterState.idleAnimFrame = 0;
        guyCharacterState.animTimer += timeStepFactor;
        if (guyCharacterState.animTimer >= guyConfig.animSpeed) {
            guyCharacterState.animTimer = 0;
            guyCharacterState.animFrame = (guyCharacterState.animFrame === 1) ? 2 : 1;
        }
        
        if (!isBallFallingNearGround && (!ballIsEffectivelySlow || !ballIsOnGround)) {
            guyCharacterState.state = 'idle';
            guyCharacterState.idleAnimTimer = 0;
            guyCharacterState.animFrame = 0;
            return;
        }

        let targetX = ballState.x;
        let dx = targetX - guyCharacterState.x;
        if (Math.abs(dx) > 1) {
            guyCharacterState.facingRight = dx > 0;
            guyCharacterState.x += Math.sign(dx) * guyConfig.speed * timeStepFactor;
        }

        let distanceToBallCenter = Math.abs(guyCharacterState.x - ballState.x);
        if (distanceToBallCenter < (ballState.radius + effectiveGuyWidth / 2) && ballIsOnGround) {
            guyCharacterState.state = 'throwing';
            guyCharacterState.idleAnimFrame = 0;
            guyCharacterState.animFrame = 0;
        }
    } else if (guyCharacterState.state === 'throwing') {
        ballState.isGrounded = false;
        ballState.isCeilingGrounded = false;
        ballState.ay = -guyConfig.throwImpulseY;
        ballState.ax += (Math.random() - 0.5) * guyConfig.throwImpulseX * 2;
        ballState.hasBeenHitSinceGround = true;
        if (ballState.y + ballState.radius >= groundLevel) {
            ballState.y = groundLevel - ballState.radius - 1;
        }
        guyCharacterState.state = 'idle';
        guyCharacterState.idleAnimTimer = 0;
        guyCharacterState.animFrame = 0;
    }
}

export function drawGuy(ctx, canvas) {
    if (!canvas || !ctx) return;

    let groundLevel = canvas.height - canvasConfig.bottomPadding;
    let guyBottomY = groundLevel + guyCharacterState.y;
    let legTopY = guyBottomY - guyConfig.legLength;
    let bodyBottomY = legTopY;
    let bodyTopY = bodyBottomY - guyConfig.bodyHeight;
    let headCenterY = bodyTopY - guyConfig.headRadius;

    const skinColor = '#F5D0A9';
    let shirtColor = '#4682B4';
    if (guyCharacterState.state === 'throwing') shirtColor = '#FF6347';
    if (guyCharacterState.state === 'celebrating') shirtColor = '#ff6600';

    const pantsColor = '#3D2B1F';
    const hairColor = '#333333';
    const eyeColor = '#000000';

    ctx.save();
    ctx.translate(guyCharacterState.x, 0);

    // Shadow
    let shadowWidth = guyConfig.bodyWidth * (1 + guyCharacterState.y / 50);
    if (shadowWidth > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, groundLevel, shadowWidth, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Legs
    ctx.fillStyle = pantsColor;
    const legAttachPointXOffset = guyConfig.bodyWidth / 4;
    const legPivotY = legTopY;
    const standAngleSplay = Math.PI / 18;
    const runCycleMaxAngle = Math.PI / 4.5;
    let leftScreenLegAngle, rightScreenLegAngle;

    if (guyCharacterState.y < 0) { // In Air
        leftScreenLegAngle = Math.PI / 6; rightScreenLegAngle = -Math.PI / 6;
    } else if (guyCharacterState.state === 'idle' || guyCharacterState.animFrame === 0) {
        leftScreenLegAngle = -standAngleSplay; rightScreenLegAngle = standAngleSplay;
    } else {
        const forwardAngle = runCycleMaxAngle; const backwardAngle = -runCycleMaxAngle;
        if (guyCharacterState.animFrame === 1) {
            if (guyCharacterState.facingRight) { leftScreenLegAngle = forwardAngle; rightScreenLegAngle = backwardAngle; } 
            else { leftScreenLegAngle = backwardAngle; rightScreenLegAngle = forwardAngle; }
        } else {
            if (guyCharacterState.facingRight) { leftScreenLegAngle = backwardAngle; rightScreenLegAngle = forwardAngle; } 
            else { leftScreenLegAngle = forwardAngle; rightScreenLegAngle = backwardAngle; }
        }
    }
    ctx.save(); ctx.translate(-legAttachPointXOffset, legPivotY); ctx.rotate(leftScreenLegAngle);
    ctx.fillRect(-guyConfig.legWidth / 2, 0, guyConfig.legWidth, guyConfig.legLength); ctx.restore();
    ctx.save(); ctx.translate(legAttachPointXOffset, legPivotY); ctx.rotate(rightScreenLegAngle);
    ctx.fillRect(-guyConfig.legWidth / 2, 0, guyConfig.legWidth, guyConfig.legLength); ctx.restore();
    
    // Body
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-guyConfig.bodyWidth / 2, bodyTopY, guyConfig.bodyWidth, guyConfig.bodyHeight);

    // Arms
    let armAttachY = bodyTopY + guyConfig.shoulderYOffset;
    let screenLeftArmAngle, screenRightArmAngle;
    if (guyCharacterState.state === 'celebrating' || guyCharacterState.y < 0) {
        // Hands in air!
        screenLeftArmAngle = -Math.PI / 1.4; screenRightArmAngle = Math.PI / 1.4;
    } else if (guyCharacterState.state === 'following' && guyCharacterState.animFrame !== 0) {
        const armForwardSwing = guyConfig.armSwingMaxAngle; const armBackwardSwing = -guyConfig.armSwingMaxAngle;
        let charLeftArmTargetAngle, charRightArmTargetAngle;
        if (guyCharacterState.animFrame === 1) { charLeftArmTargetAngle = armBackwardSwing; charRightArmTargetAngle = armForwardSwing; } 
        else { charLeftArmTargetAngle = armForwardSwing; charRightArmTargetAngle = armBackwardSwing; }
        if (guyCharacterState.facingRight) { screenLeftArmAngle = charLeftArmTargetAngle; screenRightArmAngle = charRightArmTargetAngle; } 
        else { screenLeftArmAngle = charRightArmTargetAngle; screenRightArmAngle = charLeftArmTargetAngle; }
    } else if (guyCharacterState.state === 'throwing') {
        const throwArmUpAngle = -Math.PI / 2.5; const otherArmAngle = Math.PI / 8;
        if (guyCharacterState.facingRight) { screenRightArmAngle = throwArmUpAngle; screenLeftArmAngle = otherArmAngle; } 
        else { screenLeftArmAngle = throwArmUpAngle; screenRightArmAngle = otherArmAngle; }
    } else { 
        screenLeftArmAngle = guyConfig.idleRestAngle; screenRightArmAngle = guyConfig.idleRestAngle;
        if (guyCharacterState.state === 'idle') {
            switch (guyCharacterState.idleAnimFrame) {
                case 1: screenRightArmAngle = guyConfig.idleRestAngle - Math.PI / 24; break;
                case 2: screenLeftArmAngle = guyConfig.idleRestAngle - Math.PI / 24; break;
                case 4: screenLeftArmAngle = guyConfig.idleRestAngle + Math.PI / 30; break;
                case 6: screenRightArmAngle = -Math.PI / 3.5; break; // Wave
            }
        }
    }
    ctx.fillStyle = skinColor;
    const armPivotX_center = guyConfig.bodyWidth / 2;
    ctx.save(); ctx.translate(-armPivotX_center, armAttachY); ctx.rotate(screenLeftArmAngle);
    ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
    ctx.save(); ctx.translate(armPivotX_center, armAttachY); ctx.rotate(screenRightArmAngle);
    ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();

    // Head
    ctx.save(); ctx.translate(0, headCenterY);
    if (guyCharacterState.state === 'idle') {
        switch (guyCharacterState.idleAnimFrame) {
            case 1: ctx.rotate(-guyConfig.headTiltAngle); break;
            case 2: ctx.rotate(guyConfig.headTiltAngle); break;
            case 5: ctx.scale(1.05, 0.95); break; // Slight squash
        }
    }
    ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(0, 0, guyConfig.headRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hairColor; ctx.beginPath(); ctx.arc(0, -guyConfig.headRadius * 0.3, guyConfig.headRadius * 0.9, Math.PI, Math.PI * 2); ctx.fill();
    
    // Dynamic Eye Tracking (Looking at the ball!)
    if (!guyCharacterState.isBlinking) {
        ctx.fillStyle = eyeColor;
        const eyeBaseX = guyConfig.headRadius * 0.3;
        const eyeY = -guyConfig.headRadius * 0.15;
        const eyeSize = 2;

        if (guyCharacterState.emotion === 'happy' || guyCharacterState.state === 'celebrating') {
            // Happy closed eyes (^ ^)
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(-eyeBaseX, eyeY, 2, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(eyeBaseX, eyeY, 2, Math.PI, 0);
            ctx.stroke();
        } else {
            // Calculate eye direction toward ball
            const dxToBall = ballState.x - guyCharacterState.x;
            const dyToBall = ballState.y - (headCenterY);
            const angleToBall = Math.atan2(dyToBall, dxToBall);
            const eyeLookOffsetX = Math.cos(angleToBall) * 1.5;
            const eyeLookOffsetY = Math.sin(angleToBall) * 1.2;

            ctx.fillRect(-eyeBaseX + eyeLookOffsetX - eyeSize / 2, eyeY + eyeLookOffsetY - eyeSize / 2, eyeSize, eyeSize);
            ctx.fillRect(eyeBaseX + eyeLookOffsetX - eyeSize / 2, eyeY + eyeLookOffsetY - eyeSize / 2, eyeSize, eyeSize);
        }
    }
    ctx.restore(); 
    ctx.restore(); 
}

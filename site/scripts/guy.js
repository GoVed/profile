// scripts/guy.js
import { guyConfig, canvasConfig } from './config';
import { ballState } from './ball'; // To access ball's state for interaction

export let guyCharacterState = { // Renamed to avoid conflict if 'guyState' is too generic
    x: 0,
    state: 'idle', // 'idle', 'following', 'throwing'
    animFrame: 0, // 0: stand, 1: run_step1, 2: run_step2
    animTimer: 0,
    facingRight: true,
    idleAnimFrame: 0,
    idleAnimTimer: 0,
};

export function initGuy() {
    guyCharacterState.x = guyConfig.bodyWidth / 2 + 10;
    guyCharacterState.state = 'idle';
    guyCharacterState.animFrame = 0;
    guyCharacterState.idleAnimFrame = 0;
    guyCharacterState.idleAnimTimer = 0;
    guyCharacterState.facingRight = true;
}

export function updateGuyInteraction(timeStepFactor, canvas) {
    let ballSpeed = Math.sqrt(ballState.ax * ballState.ax + ballState.ay * ballState.ay);
    let ballIsEffectivelySlow = ballSpeed < guyConfig.ballSlowThreshold;
    let ballIsOnGround = (ballState.y >= canvas.height - ballState.radius - canvasConfig.bottomPadding - 1);
    let effectiveGuyWidth = guyConfig.bodyWidth;

    // Clamp guyX to canvas bounds
    guyCharacterState.x = Math.max(effectiveGuyWidth / 2, Math.min(guyCharacterState.x, canvas.width - effectiveGuyWidth / 2));

    if (guyCharacterState.state === 'idle') {
        guyCharacterState.animFrame = 0;
        guyCharacterState.idleAnimTimer += timeStepFactor;
        if (guyCharacterState.idleAnimTimer >= guyConfig.idleAnimSpeed) {
            guyCharacterState.idleAnimTimer = 0;
            guyCharacterState.idleAnimFrame = (guyCharacterState.idleAnimFrame + 1) % guyConfig.idleAnimMaxFrames;
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
        if (!ballIsEffectivelySlow || !ballIsOnGround) {
            guyCharacterState.state = 'idle';
            guyCharacterState.idleAnimTimer = 0;
            guyCharacterState.animFrame = 0;
            return;
        }
        let targetX = ballState.x;
        let dx = targetX - guyCharacterState.x;
        if (Math.abs(dx) > 1) guyCharacterState.facingRight = dx > 0;
        if (Math.abs(dx) > 1) guyCharacterState.x += Math.sign(dx) * guyConfig.speed * timeStepFactor;

        let distanceToBallCenter = Math.abs(guyCharacterState.x - ballState.x);
        if (distanceToBallCenter < (ballState.radius + effectiveGuyWidth / 2) && ballIsOnGround) {
            guyCharacterState.state = 'throwing';
            guyCharacterState.idleAnimFrame = 0;
            guyCharacterState.animFrame = 0;
        }
    } else if (guyCharacterState.state === 'throwing') {
        ballState.ay = -guyConfig.throwImpulseY;
        ballState.ax += (Math.random() - 0.5) * guyConfig.throwImpulseX * 2;
        if (ballState.y + ballState.radius >= canvas.height - canvasConfig.bottomPadding) {
            ballState.y = canvas.height - canvasConfig.bottomPadding - ballState.radius - 1;
        }
        guyCharacterState.state = 'idle';
        guyCharacterState.idleAnimTimer = 0;
        guyCharacterState.animFrame = 0;
    }
}

export function drawGuy(ctx, canvas) {
    if (!canvas || !ctx) return;

    let groundLevel = canvas.height - canvasConfig.bottomPadding;
    let guyBottomY = groundLevel;
    let legTopY = guyBottomY - guyConfig.legLength;
    let bodyBottomY = legTopY;
    let bodyTopY = bodyBottomY - guyConfig.bodyHeight;
    let headCenterY = bodyTopY - guyConfig.headRadius;

    const skinColor = '#F5D0A9';
    const shirtColor = (guyCharacterState.state === 'throwing') ? '#FF6347' : '#4682B4';
    const pantsColor = '#3D2B1F';
    const hairColor = '#333333';
    const eyeColor = '#000000';

    ctx.save();
    ctx.translate(guyCharacterState.x, 0);

    // Legs
    ctx.fillStyle = pantsColor;
    const legAttachPointXOffset = guyConfig.bodyWidth / 4;
    const legPivotY = legTopY;
    const standAngleSplay = Math.PI / 18;
    const runCycleMaxAngle = Math.PI / 4.5;
    let leftScreenLegAngle, rightScreenLegAngle;

    if (guyCharacterState.state === 'idle' || guyCharacterState.animFrame === 0) {
        leftScreenLegAngle = -standAngleSplay; rightScreenLegAngle = standAngleSplay;
    } else {
        const forwardAngle = runCycleMaxAngle; const backwardAngle = -runCycleMaxAngle;
        if (guyCharacterState.animFrame === 1) {
            if (guyCharacterState.facingRight) { leftScreenLegAngle = forwardAngle; rightScreenLegAngle = backwardAngle; } 
            else { leftScreenLegAngle = backwardAngle; rightScreenLegAngle = forwardAngle; }
        } else { // guyCharacterState.animFrame === 2
            if (guyCharacterState.facingRight) { leftScreenLegAngle = backwardAngle; rightScreenLegAngle = forwardAngle; } 
            else { leftScreenLegAngle = forwardAngle; rightScreenLegAngle = backwardAngle; }
        }
    }
    ctx.save(); ctx.translate(-legAttachPointXOffset, legPivotY); ctx.rotate(leftScreenLegAngle);
    ctx.fillRect(-guyConfig.legWidth / 2, 0, guyConfig.legWidth, guyConfig.legLength); ctx.restore();
    ctx.save(); ctx.translate(legAttachPointXOffset, legPivotY); ctx.rotate(rightScreenLegAngle);
    ctx.fillRect(-guyConfig.legWidth / 2, 0, guyConfig.legWidth, guyConfig.legLength); ctx.restore();
    
    ctx.fillStyle = shirtColor; // Body
    ctx.fillRect(-guyConfig.bodyWidth / 2, bodyTopY, guyConfig.bodyWidth, guyConfig.bodyHeight);

    // Arms
    let armAttachY = bodyTopY + guyConfig.shoulderYOffset;
    let screenLeftArmAngle, screenRightArmAngle; // Use distinct names for arm angles
    if (guyCharacterState.state === 'following' && guyCharacterState.animFrame !== 0) {
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
            }
        }
    }
    ctx.fillStyle = skinColor;
    if (guyCharacterState.state === 'idle') {
        const idleArmShoulderPivotX = guyConfig.bodyWidth / 2;
        ctx.save(); ctx.translate(-idleArmShoulderPivotX, armAttachY); ctx.rotate(screenLeftArmAngle);
        ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
        ctx.save(); ctx.translate(idleArmShoulderPivotX, armAttachY); ctx.rotate(screenRightArmAngle);
        ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
    } else {
        const armPivotX_center = 0;
        if (guyCharacterState.state === 'following') {
            ctx.save(); ctx.translate(armPivotX_center, armAttachY); ctx.rotate(screenLeftArmAngle);
            ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
        } else if (guyCharacterState.state === 'throwing') {
            ctx.save(); ctx.translate(armPivotX_center, armAttachY); ctx.rotate(screenRightArmAngle);
            ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
            ctx.save(); ctx.translate(armPivotX_center, armAttachY); ctx.rotate(screenLeftArmAngle);
            ctx.fillRect(-guyConfig.armWidth / 2, 0, guyConfig.armWidth, guyConfig.armLength); ctx.restore();
        }
    }

    // Head
    ctx.save(); ctx.translate(0, headCenterY);
    if (guyCharacterState.state === 'idle') {
        switch (guyCharacterState.idleAnimFrame) {
            case 1: ctx.rotate(-guyConfig.headTiltAngle); break;
            case 2: ctx.rotate(guyConfig.headTiltAngle); break;
        }
    }
    ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(0, 0, guyConfig.headRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hairColor; ctx.beginPath(); ctx.arc(0, -guyConfig.headRadius * 0.3, guyConfig.headRadius * 0.9, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eyeColor;
    let eyeBaseX = guyConfig.headRadius * 0.3; let eyeY = -guyConfig.headRadius * 0.2; let eyeSize = 2;
    if (guyCharacterState.state === 'idle') {
        let eyeShiftX = 0;
        if (guyCharacterState.idleAnimFrame === 3) eyeShiftX = -guyConfig.headRadius * 0.15;
        if (guyCharacterState.idleAnimFrame === 4) eyeShiftX = guyConfig.headRadius * 0.15;
        ctx.fillRect(-eyeBaseX + eyeShiftX - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
        ctx.fillRect(eyeBaseX + eyeShiftX - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
    } else {
        let eyeOffsetX = eyeBaseX * (guyCharacterState.facingRight ? 1 : -1);
        ctx.fillRect(eyeOffsetX - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
    }
    ctx.restore(); // Head transform
    ctx.restore(); // Guy translate
}
// site/scripts/ball.js
import { ballConfig, canvasConfig } from './config';
import { getRandomInt } from './utils';

// Primary ball reference for backwards compatibility with guy.js
export let ballState = {
    id: 0,
    x: 0,
    y: 0,
    ax: 0,
    ay: 0,
    radius: ballConfig.radius,
    px: -1,
    py: -1,
    mouseDownTime: 0,
    colorIndex: 0,
    squashX: 1,
    squashY: 1,
    trail: [],
    lastFloorHitTime: 0,
    hasBeenHitSinceGround: false,
    isGrounded: false,
    isCeilingGrounded: false
};

export let balls = [ballState];

export function getBalls() {
    return balls;
}

export function initBall(canvasWidth) {
    ballState.x = getRandomInt(80, canvasWidth ? Math.max(80, canvasWidth - 80) : 400);
    ballState.y = getRandomInt(ballState.radius + 10, 80);
    ballState.ax = getRandomInt(-4, 4);
    ballState.ay = 0;
    ballState.radius = ballConfig.radius;
    ballState.mouseDownTime = new Date().getTime();
    ballState.colorIndex = 0;
    ballState.squashX = 1;
    ballState.squashY = 1;
    ballState.trail = [];
    ballState.hasBeenHitSinceGround = false;
    ballState.isGrounded = false;
    ballState.isCeilingGrounded = false;

    // Reset array to single primary ball
    balls = [ballState];
}

export function addBall(canvasWidth, canvasHeight) {
    if (balls.length >= 8) return null;

    const colorIndex = balls.length % ballConfig.colors.length;
    const newBall = {
        id: Date.now() + Math.random(),
        x: getRandomInt(60, canvasWidth ? Math.max(60, canvasWidth - 60) : 300),
        y: getRandomInt(30, 80),
        ax: (Math.random() - 0.5) * 8,
        ay: Math.random() * 2,
        radius: Math.max(16, ballConfig.radius - (balls.length * 1.2)),
        px: -1,
        py: -1,
        mouseDownTime: 0,
        colorIndex: colorIndex,
        squashX: 1,
        squashY: 1,
        trail: [],
        lastFloorHitTime: 0,
        hasBeenHitSinceGround: true,
        isGrounded: false,
        isCeilingGrounded: false
    };
    balls.push(newBall);
    return newBall;
}

export function resetBalls(canvasWidth) {
    initBall(canvasWidth);
}

export function findBallNear(x, y, extraTolerance = 2.4) {
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        const dx = x - b.x;
        const dy = y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) <= Math.max(48, b.radius * extraTolerance)) {
            return b;
        }
    }
    return null;
}

export function isPointNearBall(x, y, extraTolerance = 2.4) {
    return findBallNear(x, y, extraTolerance) !== null;
}

/**
 * Applies a dynamic juggle launch when clicking/tapping on a ball
 */
export function juggleBall(ball, clickX, clickY) {
    const now = Date.now();
    if (now - (ball.lastJuggleTime || 0) < 180) {
        return null; // Debounce multi-event triggers
    }
    ball.lastJuggleTime = now;

    // Relative hit offset (-1 to 1)
    const relX = (clickX !== undefined) ? (ball.x - clickX) / (ball.radius || 24) : (Math.random() - 0.5);
    
    // Unstick completely from ground and ceiling
    ball.isGrounded = false;
    ball.isCeilingGrounded = false;

    // Launch upward with punchy, high-energy bounce
    ball.ay = ballConfig.juggleImpulseY - (Math.random() * 2.0);
    ball.ax = Math.max(-ballConfig.juggleImpulseXMax, Math.min(ballConfig.juggleImpulseXMax, (ball.ax * 0.35) + (relX * 6.0)));

    // Squash & stretch punch
    ball.squashX = 0.7;
    ball.squashY = 1.45;
    ball.hasBeenHitSinceGround = true;

    return {
        ball,
        impulse: Math.abs(ball.ay)
    };
}

export function handleBallTap(x, y, onJuggle) {
    const targetBall = findBallNear(x, y, 2.2);
    if (targetBall) {
        targetBall.mouseDownTime = Date.now();
        targetBall.px = x;
        targetBall.py = y;
        const res = juggleBall(targetBall, x, y);
        if (res && onJuggle) {
            onJuggle(targetBall);
        }
        return res !== null;
    }
    return false;
}

export function handleBallDrag(x, y) {
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.px !== -1 && b.mouseDownTime > 0) {
            const now = Date.now();
            const delta = now - b.mouseDownTime;
            const dx = x - b.px;
            const dy = y - b.py;
            if (delta < 250 && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                const dtSec = Math.max(0.012, delta / 1000);
                const vx = (dx / dtSec) * 0.035;
                const vy = (dy / dtSec) * 0.035;
                b.ax = Math.max(-ballConfig.maxSpeed, Math.min(ballConfig.maxSpeed, b.ax * 0.4 + vx));
                if (vy < 0) {
                    b.ay = Math.max(-ballConfig.maxSpeed, Math.min(b.ay, b.ay * 0.4 + vy));
                }
                b.isGrounded = false;
                b.isCeilingGrounded = false;
                b.px = x;
                b.py = y;
                b.mouseDownTime = now;
                return true;
            }
        }
    }
    return false;
}

export function handleBallMouseDown(x, y, onJuggle) {
    if (onJuggle) {
        return handleBallTap(x, y, onJuggle);
    } else {
        return handleBallDrag(x, y);
    }
}

export function updateBallPhysics(timeStepFactor, canvas, gravityMultiplier = 1.0, onBounce = null, onGroundHit = null) {
    const groundLevel = canvas.height - canvasConfig.bottomPadding;
    const effectiveGravity = ballConfig.gravity * gravityMultiplier;

    for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        // Motion trail
        const speedSq = b.ax * b.ax + b.ay * b.ay;
        if (speedSq > 2.0) {
            b.trail.unshift({ x: b.x, y: b.y, alpha: 0.5 });
            if (b.trail.length > 6) b.trail.pop();
        } else if (b.trail.length > 0) {
            b.trail.pop();
        }

        // Horizontal Movement & Clamping
        b.x += b.ax * timeStepFactor;
        b.ax *= Math.pow(0.997, timeStepFactor); // Air resistance

        // Squash & stretch recovery back to 1.0
        const squashRecovery = 1 - Math.pow(0.85, timeStepFactor);
        b.squashX += (1.0 - b.squashX) * squashRecovery;
        b.squashY += (1.0 - b.squashY) * squashRecovery;

        // VERTICAL PHYSICS STATE MACHINE:
        if (gravityMultiplier > 0) {
            // Normal downward gravity
            b.isCeilingGrounded = false;

            if (b.isGrounded) {
                b.y = groundLevel - b.radius;
                b.ay = 0;
                // Rolling friction on ground (exponential decay)
                b.ax *= Math.pow(1 - ballConfig.friction * 2.5, timeStepFactor);
                if (Math.abs(b.ax) < ballConfig.threshold) b.ax = 0;
            } else {
                b.ay += (effectiveGravity * timeStepFactor);
                b.y += b.ay * timeStepFactor;

                // Check ground impact
                if (b.y >= groundLevel - b.radius) {
                    b.y = groundLevel - b.radius;
                    const impactSpeed = Math.abs(b.ay);

                    // If impact is small (< 1.8 px/s), settle completely without micro-bouncing
                    if (impactSpeed < 1.8) {
                        b.isGrounded = true;
                        b.ay = 0;
                    } else {
                        b.ay = -b.ay * 0.80; // Damped bounce
                        b.squashX = Math.min(1.4, 1.0 + impactSpeed * 0.05);
                        b.squashY = Math.max(0.6, 1.0 - impactSpeed * 0.05);
                        if (onBounce) onBounce(b, impactSpeed);
                    }

                    if (b.hasBeenHitSinceGround) {
                        b.hasBeenHitSinceGround = false;
                        if (onGroundHit && b === ballState) {
                            onGroundHit(b);
                        }
                    }
                }
            }

            // Ceiling check
            if (b.y < b.radius) {
                b.y = b.radius;
                const impactSpeed = Math.abs(b.ay);
                b.ay = -b.ay * 0.80;
                if (impactSpeed > 1.2 && onBounce) onBounce(b, impactSpeed);
            }
        } else if (gravityMultiplier < 0) {
            // Antigravity (floating up to ceiling)
            b.isGrounded = false;

            if (b.isCeilingGrounded) {
                b.y = b.radius;
                b.ay = 0;
                b.ax *= Math.pow(1 - ballConfig.friction * 2.5, timeStepFactor);
                if (Math.abs(b.ax) < ballConfig.threshold) b.ax = 0;
            } else {
                b.ay += (effectiveGravity * timeStepFactor);
                b.y += b.ay * timeStepFactor;

                if (b.y <= b.radius) {
                    b.y = b.radius;
                    const impactSpeed = Math.abs(b.ay);
                    if (impactSpeed < 1.8) {
                        b.isCeilingGrounded = true;
                        b.ay = 0;
                    } else {
                        b.ay = -b.ay * 0.80;
                        if (onBounce) onBounce(b, impactSpeed);
                    }
                }
            }

            // Floor check
            if (b.y > groundLevel - b.radius) {
                b.y = groundLevel - b.radius;
                b.ay = -b.ay * 0.80;
            }
        } else {
            // Zero-G
            b.isGrounded = false;
            b.isCeilingGrounded = false;
            b.y += b.ay * timeStepFactor;

            if (b.y > groundLevel - b.radius) {
                b.y = groundLevel - b.radius;
                b.ay = -b.ay * 0.85;
                if (onBounce) onBounce(b, Math.abs(b.ay));
            }
            if (b.y < b.radius) {
                b.y = b.radius;
                b.ay = -b.ay * 0.85;
                if (onBounce) onBounce(b, Math.abs(b.ay));
            }
        }

        // Left / Right Walls
        if (b.x > canvas.width - b.radius) {
            b.x = canvas.width - b.radius;
            b.ax = -b.ax * 0.85;
            if (Math.abs(b.ax) < 0.2) b.ax = 0;
            if (Math.abs(b.ax) > 1.0 && onBounce) onBounce(b, Math.abs(b.ax));
        }
        if (b.x < b.radius) {
            b.x = b.radius;
            b.ax = -b.ax * 0.85;
            if (Math.abs(b.ax) < 0.2) b.ax = 0;
            if (Math.abs(b.ax) > 1.0 && onBounce) onBounce(b, Math.abs(b.ax));
        }

        // Clamp max speed
        const currentSpeed = Math.sqrt(b.ax * b.ax + b.ay * b.ay);
        if (currentSpeed > ballConfig.maxSpeed) {
            const scale = ballConfig.maxSpeed / currentSpeed;
            b.ax *= scale;
            b.ay *= scale;
        }
    }

    // Ball-to-ball collisions when multiple balls exist
    if (balls.length > 1) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const b1 = balls[i];
                const b2 = balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = b1.radius + b2.radius;

                if (dist < minDist && dist > 0.001) {
                    b1.isGrounded = false;
                    b2.isGrounded = false;

                    const overlap = (minDist - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    b1.x -= nx * overlap;
                    b1.y -= ny * overlap;
                    b2.x += nx * overlap;
                    b2.y += ny * overlap;

                    const kx = b1.ax - b2.ax;
                    const ky = b1.ay - b2.ay;
                    const p = 2 * (nx * kx + ny * ky) / 2;

                    b1.ax -= p * nx * 0.9;
                    b1.ay -= p * ny * 0.9;
                    b2.ax += p * nx * 0.9;
                    b2.ay += p * ny * 0.9;

                    if (onBounce) onBounce(b1, Math.abs(p));
                }
            }
        }
    }
}

export function drawBall(ctx) {
    drawAllBalls(ctx);
}

export function drawAllBalls(ctx) {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const colorPalette = ballConfig.colors[b.colorIndex % ballConfig.colors.length];

        ctx.save();

        // Draw subtle speed trail
        if (b.trail && b.trail.length > 0) {
            for (let t = 0; t < b.trail.length; t++) {
                const tr = b.trail[t];
                const trailAlpha = (1 - (t / b.trail.length)) * 0.25;
                const trailRadius = b.radius * (1 - (t / b.trail.length) * 0.5);
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, Math.max(2, trailRadius), 0, Math.PI * 2);
                ctx.fillStyle = colorPalette.glow;
                ctx.globalAlpha = trailAlpha;
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        // Draw contact shadow on ground
        const groundLevel = ctx.canvas.height / (window.devicePixelRatio || 1) - canvasConfig.bottomPadding;
        const distToGround = Math.max(0, groundLevel - (b.y + b.radius));
        const shadowOpacity = Math.max(0, (1 - distToGround / 200) * (isDark ? 0.35 : 0.2));
        if (shadowOpacity > 0.01) {
            const shadowRadius = Math.max(4, b.radius * (1 - distToGround / 300));
            ctx.beginPath();
            ctx.ellipse(b.x, groundLevel + 1, shadowRadius * 1.2, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
            ctx.fill();
        }

        // Translate and apply squash & stretch
        ctx.translate(b.x, b.y);
        ctx.scale(b.squashX, b.squashY);

        // Outer glow
        ctx.shadowColor = colorPalette.primary;
        ctx.shadowBlur = b.hasBeenHitSinceGround ? 12 : 6;

        // Glossy Sphere Radial Gradient
        const grad = ctx.createRadialGradient(
            -b.radius * 0.3, -b.radius * 0.35, b.radius * 0.1,
            0, 0, b.radius
        );

        if (i === 0) {
            // Primary ball: signature vibrant orange
            grad.addColorStop(0, '#ff9944');
            grad.addColorStop(0.6, '#ff6600');
            grad.addColorStop(1, '#b33c00');
        } else {
            // Spawned balls
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, colorPalette.primary);
            grad.addColorStop(1, '#111827');
        }

        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Specular highlight shine
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(-b.radius * 0.32, -b.radius * 0.35, b.radius * 0.35, b.radius * 0.2, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }
}
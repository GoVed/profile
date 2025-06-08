// scripts/ball.js
import { ballConfig, canvasConfig } from './config';
import { getRandomInt } from './utils';

export let ballState = {
    x: 0,
    y: 0,
    ax: 0,
    ay: 0,
    radius: ballConfig.radius,
    px: -1, // for mouse interaction
    py: -1, // for mouse interaction
    mouseDownTime: 0,
};

export function initBall(canvasWidth) {
    ballState.x = getRandomInt(50, canvasWidth ? Math.max(50, canvasWidth - 50) : 500);
    ballState.y = getRandomInt(ballState.radius, 75);
    ballState.ax = getRandomInt(-10, 10);
    ballState.ay = 0;
    ballState.mouseDownTime = new Date().getTime();
}

export function handleBallMouseDown(x, y) {
    let delta = new Date().getTime() - ballState.mouseDownTime;
    // Apply impulse if quick succession of mouse moves while button is down
    if (delta < 100 && ballState.px !== -1) { 
        ballState.ax += (x - ballState.px) * delta / 1000; // Adjusted divisor for smoother control
        ballState.ay += (y - ballState.py) * delta / 1000; // Adjusted divisor
    }
    ballState.mouseDownTime = new Date().getTime();
    ballState.px = x;
    ballState.py = y;
}

export function updateBallPhysics(timeStepFactor, canvas) {
    ballState.x += ballState.ax * timeStepFactor;
    ballState.y += ballState.ay * timeStepFactor;

    // Collision detection
    if (ballState.y > canvas.height - ballState.radius - canvasConfig.bottomPadding) {
        ballState.y = canvas.height - ballState.radius - canvasConfig.bottomPadding;
        ballState.ay = -ballState.ay * ballConfig.damping;
    }
    if (ballState.y < ballState.radius) {
        ballState.y = ballState.radius;
        ballState.ay = -ballState.ay * ballConfig.damping;
    }
    if (ballState.x > canvas.width - ballState.radius) {
        ballState.x = canvas.width - ballState.radius;
        ballState.ax = -ballState.ax * ballConfig.damping;
    }
    if (ballState.x < ballState.radius) {
        ballState.x = ballState.radius;
        ballState.ax = -ballState.ax * ballConfig.damping;
    }

    ballState.ay += (ballConfig.gravity * timeStepFactor);

    if (Math.abs(ballState.ax) < ballConfig.threshold) ballState.ax = 0;
    if (Math.abs(ballState.ay) < ballConfig.threshold &&
        ballState.y >= canvas.height - ballState.radius - canvasConfig.bottomPadding - 0.1) { // Check if on ground (added small tolerance)
        ballState.ay = 0;
        ballState.ax *= (1 - ballConfig.friction * timeStepFactor);
    }
}

export function drawBall(ctx) {
    ctx.beginPath();
    ctx.arc(ballState.x, ballState.y, ballState.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "grey";
    ctx.fill();
}
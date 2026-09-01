// site/scripts/profileContent.js
import { canvasConfig, gameConfig } from './config';
import { 
    initBall, 
    addBall, 
    resetBalls, 
    handleBallMouseDown, 
    updateBallPhysics, 
    drawAllBalls, 
    isPointNearBall,
    ballState,
    balls
} from './ball';
import { 
    initGuy, 
    updateGuyInteraction, 
    drawGuy, 
    isPointNearGuy, 
    triggerGuyAction,
    guyCharacterState 
} from './guy';
import { 
    initBulb, 
    updateBulbPhysics, 
    isPointNearBulb, 
    nudgeBulb, 
    toggleBulbLight, 
    drawAmbientLight, 
    drawPureBlackShadows, 
    drawHangingBulb, 
    bulbState 
} from './bulb';
import { ParticleSystem } from './particles';
import { 
    playBounceSound, 
    playJuggleSound, 
    playHighScoreSound, 
    playGuySound, 
    toggleSound, 
    isSoundEnabled 
} from './audio';
import { Haptics } from './haptics';
import { getLines } from './utils';

var canvas = null;
var ctx = null;
var animationFrameId = null;
let lastFrameTime = 0;

// Game State
let score = 0;
let combo = 0;
let highScore = 0;
let gravityMultiplier = 1.0;
let hasAnnouncedHighScore = false;
const particles = new ParticleSystem();

// Initialize High Score
try {
    const saved = localStorage.getItem('goved_high_score');
    if (saved) highScore = parseInt(saved, 10) || 0;
} catch (e) {}

function getThemeColors() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
        text: isDarkMode ? '#e0e0e0' : 'black',
        stroke: isDarkMode ? '#555555' : 'black',
        hint: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
    };
}

/**
 * Updates DOM Game HUD
 */
export function updateGameHUD() {
    const scoreEl = document.getElementById('hud-score');
    const comboEl = document.getElementById('hud-combo');
    const highEl = document.getElementById('hud-high-score');
    const soundBtn = document.getElementById('hud-sound-btn');
    const gravBtn = document.getElementById('hud-gravity-btn');

    if (scoreEl) scoreEl.textContent = score.toString();
    if (highEl) highEl.textContent = highScore.toString();
    if (comboEl) {
        if (combo > 1) {
            comboEl.textContent = `${combo}x`;
            comboEl.parentElement?.classList.add('combo-active');
        } else {
            comboEl.textContent = '1x';
            comboEl.parentElement?.classList.remove('combo-active');
        }
    }
    if (soundBtn) {
        soundBtn.textContent = isSoundEnabled() ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        soundBtn.classList.toggle('active', isSoundEnabled());
    }
    if (gravBtn) {
        if (gravityMultiplier === 1.0) {
            gravBtn.textContent = '🌍 Gravity: 1G';
        } else if (gravityMultiplier === 0.0) {
            gravBtn.textContent = '🛸 Gravity: 0G';
        } else {
            gravBtn.textContent = '🪐 Antigravity: -1G';
        }
    }
}

/**
 * Public Controls for UI
 */
export function toggleSoundControl() {
    const enabled = toggleSound();
    updateGameHUD();
    return enabled;
}

export function cycleGravityControl() {
    if (gravityMultiplier === 1.0) {
        gravityMultiplier = 0.0;
    } else if (gravityMultiplier === 0.0) {
        gravityMultiplier = -1.0;
    } else {
        gravityMultiplier = 1.0;
    }
    
    Haptics.gravityShift();

    // Spawn playful text
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;
    const label = gravityMultiplier === 1.0 ? 'Earth Gravity 🌍' : (gravityMultiplier === 0.0 ? 'Zero-G 🛸' : 'Antigravity Mode 🪐');
    particles.spawnText(label, virtualWidth / 2, virtualHeight / 2, { color: '#00e5ff', size: 22, bold: true });
    
    updateGameHUD();
    return gravityMultiplier;
}

export function spawnBallControl() {
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;
    const newBall = addBall(virtualWidth, virtualHeight);
    if (newBall) {
        particles.spawnBurst(newBall.x, newBall.y, 10, ['#00e5ff', '#ffd700', '#ffffff']);
        playJuggleSound(balls.length);
        Haptics.medium();
    }
    return balls.length;
}

export function resetGameControl() {
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    initBall(virtualWidth);
    initGuy();
    score = 0;
    combo = 0;
    gravityMultiplier = 1.0;
    hasAnnouncedHighScore = false;
    particles.reset();
    updateGameHUD();
    Haptics.light();
}

/**
 * Draws bio text on the canvas
 */
function drawProfileText() {
    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    const isMobile = virtualWidth < 680;
    const startY = isMobile ? 150 : 120;

    ctx.font = "1.35em system-ui, -apple-system, sans-serif";
    ctx.fillStyle = colors.text;
    const lines = getLines(ctx, canvasConfig.profileText, Math.max(200, virtualWidth - 50));
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 20, startY + i * 38);
    }

    // Playful instruction hint if score is 0
    if (score === 0 && combo === 0) {
        ctx.font = "italic 0.9em system-ui, -apple-system, sans-serif";
        ctx.fillStyle = colors.hint;
        ctx.fillText("💡 Tip: Click/flick the ball to juggle with the little guy!", 20, startY + lines.length * 38 + 24);
    }
}

/**
 * Draws the ground
 */
function drawGround() {
    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;
    ctx.beginPath();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    ctx.moveTo(0, virtualHeight - canvasConfig.bottomPadding);
    ctx.lineTo(virtualWidth, virtualHeight - canvasConfig.bottomPadding);
    ctx.stroke();
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const virtualWidth = canvas.width / dpr;
    initBulb(virtualWidth);
}

/**
 * Handle successful juggle hit by user
 */
function onJuggleHit(ball) {
    combo++;
    const hitPoints = gameConfig.pointsPerHit * combo;
    score += hitPoints;

    Haptics.combo(combo);

    // Visual sparks & text
    particles.spawnBurst(ball.x, ball.y, 14, ['#ff6600', '#ffd700', '#ffffff', '#00e5ff']);
    particles.spawnText(`+${hitPoints}`, ball.x, ball.y - 20, { color: '#ff6600', size: 18, bold: true });

    if (combo > 1) {
        particles.spawnText(`${combo}x STREAK!`, ball.x, ball.y - 42, { color: '#ffd700', size: 20, bold: true });
    }

    // High Score notification
    if (score > highScore) {
        if (highScore > 0 && !hasAnnouncedHighScore) {
            hasAnnouncedHighScore = true;
            playHighScoreSound();
            particles.spawnText('🏆 NEW BEST!', ball.x, ball.y - 65, { color: '#00e5ff', size: 22, bold: true });
            triggerGuyAction('celebrate');
            Haptics.highScore();
        }
        highScore = score;
        try {
            localStorage.setItem('goved_high_score', highScore.toString());
        } catch (e) {}
    }

    playJuggleSound(combo);
    updateGameHUD();
}

/**
 * Handle save performed by the Guy character
 */
function onGuySave() {
    combo++;
    const savePoints = gameConfig.guySaveBonus * combo;
    score += savePoints;

    Haptics.guySave();

    particles.spawnBurst(ballState.x, ballState.y, 18, ['#00e5ff', '#ffd700', '#ffffff'], 1.3);
    particles.spawnText(`GUY SAVE! +${savePoints}`, ballState.x, ballState.y - 30, { color: '#00e5ff', size: 20, bold: true });

    if (score > highScore) {
        highScore = score;
        try {
            localStorage.setItem('goved_high_score', highScore.toString());
        } catch (e) {}
    }

    playGuySound('save');
    updateGameHUD();
}

/**
 * Handle ball landing on the ground
 */
function onGroundHit(ball) {
    if (combo > 0) {
        particles.spawnText('STREAK RESET 💔', ball.x, ball.y - 25, { color: '#ef4444', size: 16, bold: false });
        combo = 0;
        hasAnnouncedHighScore = false;
        updateGameHUD();
    }
}

/**
 * Handle bounce sound & spark effects
 */
function onBounce(ball, impactSpeed) {
    if (impactSpeed > 1.2) {
        playBounceSound(impactSpeed);
        if (impactSpeed > 3.0) {
            Haptics.medium();
        }
    }
    if (impactSpeed > 3.5) {
        particles.spawnBurst(ball.x, ball.y, 6, ['#999999', '#cccccc'], 0.5);
    }
}

function gameLoop(currentTime) {
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = currentTime - lastFrameTime;
    if (deltaTime > 100) deltaTime = 100; // Guard against long frame freeze or tab backgrounding
    if (deltaTime <= 0) deltaTime = 1; 

    // Calibrated against 60 FPS reference (16.6667ms) for seamless 60Hz - 240Hz - 360Hz refresh rates
    const TARGET_FRAME_TIME = 1000 / 60;
    let timeStepFactor = deltaTime / TARGET_FRAME_TIME;
    if (timeStepFactor > 2.5) timeStepFactor = 2.5;
    if (timeStepFactor < 0.05) timeStepFactor = 0.05;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
         setupCanvas();
    }
    
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;

    // Physics Updates
    updateBallPhysics(timeStepFactor, { width: virtualWidth, height: virtualHeight }, gravityMultiplier, onBounce, onGroundHit);
    updateGuyInteraction(timeStepFactor, { width: virtualWidth, height: virtualHeight }, onGuySave);
    updateBulbPhysics(timeStepFactor);
    particles.update(timeStepFactor);
    
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    // 1. Draw ambient light from bulb in the background
    drawAmbientLight(ctx, { width: virtualWidth, height: virtualHeight });

    // 2. Draw pure black shadows projected from the bulb onto background wall and ground
    drawPureBlackShadows(ctx, balls, guyCharacterState, { width: virtualWidth, height: virtualHeight });

    // 3. Draw scene foreground elements
    drawGround();
    drawAllBalls(ctx);
    drawProfileText();
    drawGuy(ctx, { width: virtualWidth, height: virtualHeight });

    // 4. Draw hanging bulb fixture & glowing filament
    drawHangingBulb(ctx);

    // 5. Draw interactive particles
    particles.draw(ctx);

    lastFrameTime = currentTime;
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Stops the animation loop
 */
export function stopProfile() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Loads the profile page, sets up canvas, HUD, and animation
 */
export function loadProfile() { 
    canvas = document.getElementById("gravityBall");
    if (!canvas) { console.error("Canvas #gravityBall not found."); return; }
    ctx = canvas.getContext("2d");
    if (!ctx) { console.error("Failed to get 2D context."); return; }

    setupCanvas();
    updateGameHUD();

    let isCapturing = false;
    let lastTouchTimestamp = 0;

    const getCanvasPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const onMouseDown = function(event) {
        if (Date.now() - lastTouchTimestamp < 400) return; // Prevent duplicate synthesized click

        const pos = getCanvasPos(event);
        const dpr = window.devicePixelRatio || 1;
        const virtualWidth = canvas.width / dpr;
        const virtualHeight = canvas.height / dpr;

        // Check if clicking near the hanging bulb
        if (isPointNearBulb(pos.x, pos.y)) {
            nudgeBulb((Math.random() - 0.5) * 0.16);
            const isLit = toggleBulbLight();
            particles.spawnBurst(bulbState.x, bulbState.y + 12, 10, isLit ? ['#ffd700', '#ffaa33', '#ffffff'] : ['#555555', '#333333']);
            playGuySound('jump');
            Haptics.light();
            return;
        }

        // Check if clicking directly on the Guy
        if (isPointNearGuy(pos.x, pos.y, { width: virtualWidth, height: virtualHeight })) {
            triggerGuyAction('click');
            particles.spawnBurst(pos.x, pos.y - 15, 10, ['#ff6600', '#ffd700', '#ffffff']);
            particles.spawnText('✨ HEY! ✨', pos.x, pos.y - 35, { color: '#ff6600', size: 16, bold: true });
            playGuySound('jump');
            Haptics.guyCelebration();
            return;
        }

        // Check if clicking near a ball
        if (isPointNearBall(pos.x, pos.y)) {
            isCapturing = true;
            handleBallMouseDown(pos.x, pos.y, onJuggleHit);
        }
    };

    const onMouseUp = () => {
        isCapturing = false;
    };

    const onMouseMove = function(event) {
        if (event.buttons === 1 && isCapturing) {
            event.preventDefault();
            const pos = getCanvasPos(event);
            handleBallMouseDown(pos.x, pos.y);
        }
    };

    const onTouchStart = function(event) {
        lastTouchTimestamp = Date.now();
        if (event.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const posX = touch.clientX - rect.left;
            const posY = touch.clientY - rect.top;
            const dpr = window.devicePixelRatio || 1;
            const virtualWidth = canvas.width / dpr;
            const virtualHeight = canvas.height / dpr;

            // Check if tapping on the hanging bulb
            if (isPointNearBulb(posX, posY)) {
                event.preventDefault();
                nudgeBulb((Math.random() - 0.5) * 0.16);
                const isLit = toggleBulbLight();
                particles.spawnBurst(bulbState.x, bulbState.y + 12, 10, isLit ? ['#ffd700', '#ffaa33', '#ffffff'] : ['#555555', '#333333']);
                playGuySound('jump');
                Haptics.light();
                return;
            }

            // Check if tapping on guy
            if (isPointNearGuy(posX, posY, { width: virtualWidth, height: virtualHeight })) {
                event.preventDefault();
                triggerGuyAction('click');
                particles.spawnBurst(posX, posY - 15, 10, ['#ff6600', '#ffd700', '#ffffff']);
                particles.spawnText('✨ HEY! ✨', posX, posY - 35, { color: '#ff6600', size: 16, bold: true });
                playGuySound('jump');
                Haptics.guyCelebration();
                return;
            }

            if (isPointNearBall(posX, posY)) {
                event.preventDefault();
                isCapturing = true;
                handleBallMouseDown(posX, posY, onJuggleHit);
            }
        }
    };

    const onTouchMove = function(event) {
        if (isCapturing && event.touches.length > 0) {
            event.preventDefault(); 
            const rect = canvas.getBoundingClientRect();
            const touch = event.touches[0];
            handleBallMouseDown(touch.clientX - rect.left, touch.clientY - rect.top);
        }
    };

    const onTouchEnd = () => {
        isCapturing = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    
    const virtualWidth = canvas.width / (window.devicePixelRatio || 1);
    initBall(virtualWidth); 
    initGuy();
    initBulb(virtualWidth);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastFrameTime = 0; 
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Expose controls to global window for HUD button onclick handlers
if (typeof window !== 'undefined') {
    window.govedGame = {
        toggleSound: toggleSoundControl,
        cycleGravity: cycleGravityControl,
        spawnBall: spawnBallControl,
        resetGame: resetGameControl
    };
}

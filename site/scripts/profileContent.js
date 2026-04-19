import { canvasConfig } from './config';
import { initBall, handleBallMouseDown, updateBallPhysics, drawBall, isPointNearBall } from './ball';
import { initGuy, updateGuyInteraction, drawGuy } from './guy';
import { getLines } from './utils';

var canvas = null;
var ctx = null;
var animationFrameId = null;
let lastFrameTime = 0;

function getThemeColors() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
        text: isDarkMode ? '#e0e0e0' : 'black',
        stroke: isDarkMode ? '#555555' : 'black'
    };
}

/**
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the text on the canvas
 */
function drawProfileText(){ // Renamed to be more specific
    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    ctx.font = "1.5em Arial";
    ctx.fillStyle = colors.text;
    const lines = getLines(ctx, canvasConfig.profileText, virtualWidth - 40);
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 10, 40 + i * 40);
    }
}

/**
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the ground
 */
function drawGround(){
    const colors = getThemeColors();
    const dpr = window.devicePixelRatio || 1;
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;
    ctx.beginPath();
    ctx.strokeStyle = colors.stroke;
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
}

function gameLoop(currentTime) {
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = currentTime - lastFrameTime;
    if (deltaTime > 1000) deltaTime = 1000; 
    if (deltaTime <= 0) deltaTime = 1; 

    let timeStepFactor = deltaTime / 10.0;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== (rect.height - 10) * dpr) {
         setupCanvas();
    }
    
    const virtualWidth = canvas.width / dpr;
    const virtualHeight = canvas.height / dpr;

    updateBallPhysics(timeStepFactor, { width: virtualWidth, height: virtualHeight });
    updateGuyInteraction(timeStepFactor, { width: virtualWidth, height: virtualHeight });
    
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    drawGround();
    drawBall(ctx);
    drawProfileText();
    drawGuy(ctx, { width: virtualWidth, height: virtualHeight });

    lastFrameTime = currentTime;
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * @param Nothing
 * @returns Nothing
 *  Stops the animation loop
 */
export function stopProfile() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * @param Nothing
 * @returns Nothing
 *  Loads the profile page, sets up the canvas and starts the animation
 */
export function loadProfile(){ 
    canvas = document.getElementById("gravityBall");
    if (!canvas) { console.error("Canvas #gravityBall not found."); return; }
    ctx = canvas.getContext("2d");
    if (!ctx) { console.error("Failed to get 2D context."); return; }

    setupCanvas();

    let isCapturing = false;

    // Use a unique set of listeners to avoid duplicates if loadProfile is called multiple times
    const onMouseDown = function(event) {
        const rect = canvas.getBoundingClientRect();
        if (isPointNearBall(event.clientX - rect.left, event.clientY - rect.top)) {
            isCapturing = true;
        }
    };

    const onMouseUp = () => {
        isCapturing = false;
    };

    const onMouseMove = function(event) {
        if(event.buttons === 1 && isCapturing) {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            handleBallMouseDown(event.clientX - rect.left, event.clientY - rect.top);
        }
    };

    const onTouchStart = function(event) {
        if (event.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            const touch = event.touches[0];
            if (isPointNearBall(touch.clientX - rect.left, touch.clientY - rect.top)) {
                isCapturing = true;
            }
        }
    };

    const onTouchMove = function(event) {
        if (isCapturing && event.touches.length > 0) {
            event.preventDefault(); 
            const rect = canvas.getBoundingClientRect();
            handleBallMouseDown(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
        }
    };

    const onTouchEnd = () => {
        isCapturing = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    
    const virtualWidth = canvas.width / (window.devicePixelRatio || 1);
    initBall(virtualWidth); 
    initGuy();

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastFrameTime = 0; 
    animationFrameId = requestAnimationFrame(gameLoop);
}

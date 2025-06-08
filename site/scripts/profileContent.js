import { canvasConfig } from './config';
import { initBall, handleBallMouseDown, updateBallPhysics, drawBall } from './ball';
import { initGuy, updateGuyInteraction, drawGuy } from './guy';
import { getLines } from './utils';

var canvas = null;
var ctx = null;
var animationFrameId = null;
let lastFrameTime = 0;

/**
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the text on the canvas
 */
function drawProfileText(){ // Renamed to be more specific
    ctx.font = "1.5em Arial";
    ctx.fillStyle = "black";
    const lines = getLines(ctx, canvasConfig.profileText, canvas.width - 40);
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
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - canvasConfig.bottomPadding);
    ctx.lineTo(canvas.width, canvas.height - canvasConfig.bottomPadding);
    ctx.stroke();
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

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight -10) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight - 10;
    }
    
    updateBallPhysics(timeStepFactor, canvas);
    updateGuyInteraction(timeStepFactor, canvas);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGround();
    drawBall(ctx); // Pass ctx
    drawProfileText();
    drawGuy(ctx, canvas); // Pass ctx (canvas is already passed)

    lastFrameTime = currentTime;
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * @param Nothing
 * @returns Nothing
 *  Loads the profile page, sets up the canvas and starts the animation
 */
export function loadProfile(){ // Export if called from another module (e.g. contentPage.js)
    canvas = document.getElementById("gravityBall");
    if (!canvas) { console.error("Canvas #gravityBall not found."); return; }
    ctx = canvas.getContext("2d");
    if (!ctx) { console.error("Failed to get 2D context."); return; }

    canvas.addEventListener('mousemove', function(event) {
        if(event.buttons === 1) { // Primary button is down
            event.preventDefault();
            handleBallMouseDown(event.clientX - canvas.getBoundingClientRect().left, event.clientY - canvas.getBoundingClientRect().top);
        }
    });
    canvas.addEventListener('touchmove', function(event) {
        event.preventDefault(); // Prevent scrolling
        if (event.touches.length > 0) {
            handleBallMouseDown(event.touches[0].clientX - canvas.getBoundingClientRect().left, event.touches[0].clientY - canvas.getBoundingClientRect().top);
        }
    });
    
    initBall(canvas.width); // Pass initial canvas width
    initGuy();

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastFrameTime = 0; // Reset for the new loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

ballX = 0;
ballY = 0;
ballAx = 0;
ballAy = 0;
ballRadius=25;
gravity = 0.1;
damping=0.9;
threshold=0.1;
friction=0.01;
bottomPadding=25;
var px=-1;
var py=-1;
var mouseDownTime=new Date().getTime();
var init_time=new Date().getTime();
var canvas = null;
var ctx = null;
var interval = null;
/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 * @returns Integer between min and max
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param Nothing
 * @returns Nothing
 *  Loads the profile page, sets up the canvas and starts the animation
 */
function loadProfile(){
    canvas = document.getElementById("gravityBall");
    ctx = canvas.getContext("2d");
    canvas.addEventListener('mousemove', function(event) {
        if(event.buttons == 1) {
            event.preventDefault();
            mouseDown(event.clientX,event.clientY);
        }
    });
    canvas.addEventListener('touchmove', function(event) {
        mouseDown(event.touches[0].clientX,event.touches[0].clientY);
    });
    
    ballX = getRandomInt(50, 500);
    ballY = getRandomInt(25, 75);
    ballAx = getRandomInt(-10, 10);
    ballAy = 0;

    cancelAnimationFrame(interval);
    updateBall();
}

/**
 * 
 * @param {Number} x
 * @param {Number} y
 * @returns Nothing
 * 
 * Updates the ball acceleration based on mouse movement
 */
function mouseDown(x,y){
    delta = new Date().getTime() - mouseDownTime;
    if(delta < 100){
        ballAx += (x - px) * delta/100;
        ballAy += (y - py) * delta/100;
    }

    mouseDownTime = new Date().getTime();
    px = x;
    py = y;
}

/**
 * 
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the text on the canvas
 */

function drawText(){
    ctx.font = "1.5em Arial";
    ctx.fillStyle = "black";
    const profileText="An AI enthusiast who likes to build games. Chasing the butterfly of curosity everyday. \n Something interesting? Day=Gone!"
    var lines = getLines(ctx, profileText, canvas.width - 40);
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 10, 40 + i * 40);
    }
}


/**
 * 
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} text
 * @param {Number} maxWidth
 * @returns Array of lines
 * 
 * Splits the text into lines based on the width of the canvas
 */
function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        if(word=="\n"){
            lines.push(currentLine.trim());
            currentLine="";
            continue;
        }
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine.trim());
            currentLine = word;
        }
    }
    lines.push(currentLine.trim());
    return lines;
}

/**
 * 
 * @param Nothing
 * @returns Nothing
 * 
 * Updates the ball position and draws the ball and the ground
 */
function updateBall(){
    delta = new Date().getTime() - init_time;
    if(delta>1000)
        delta=1000;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight-10;
    ctx.fillStyle = 'rgba(255, 255, 255, .05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ballX += ballAx * delta/10;
    ballY += ballAy * delta/10;

    //Collision detection
    //If the ball hits the ground
    if(ballY > canvas.height - ballRadius - bottomPadding){
        ballY = canvas.height - ballRadius - bottomPadding;
        ballAy = -ballAy * damping;
    }

    //If the ball hits the ceiling
    if(ballY < ballRadius){
        ballY = ballRadius;
        ballAy = -ballAy * damping;
    }

    //If the ball hits the right wall
    if(ballX > canvas.width - ballRadius){
        ballX = canvas.width - ballRadius;
        ballAx = -ballAx * damping;
    }

    //If the ball hits the left wall
    if(ballX < ballRadius){
        ballX = ballRadius;
        ballAx = -ballAx * damping ;
    }

    // Calculate the new acceleration
    ballAy += (gravity * delta/10);

    // Apply friction
    if(Math.abs(ballAx) < threshold)
        ballAx = 0;
    if(Math.abs(ballAy) < threshold && ballY == canvas.height - ballRadius - bottomPadding){
        ballAy = 0;
        ballAx -= ballAx * friction * delta/10;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the ball and the ground
    drawGround();
    drawBall();
    drawText();

    // Call the next frame
    init_time = new Date().getTime();
    interval = requestAnimationFrame(updateBall);
}

/**
 * 
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the ball
 */
function drawBall(){
    
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "grey";
    ctx.fill();
}

/**
 * 
 * @param Nothing
 * @returns Nothing
 * 
 * Draws the ground
 */
function drawGround(){
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - bottomPadding);
    ctx.lineTo(canvas.width, canvas.height - bottomPadding);
    ctx.stroke();
}
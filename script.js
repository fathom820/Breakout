// BEGIN HTML IMPORTING //
var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

var debug = document.getElementById("debug");
debug.innerHTML = "";
var livesLabel = document.getElementById("livesLabel");
var gameOverLabel = document.getElementById("gameOverLabel");
var gameOverMenu = document.getElementById("gameOverMenu");
gameOverMenu.style.height = canvas.height.toString() + "px"; // makes div take up full game screen
var playAgainButton = document.getElementById("playAgainButton");
var info = document.getElementById("info");

// END HTML IMPORTING


// BEGIN CONTROLS //
document.addEventListener("keydown", function(event) {
	if (event.key == "a" || event.key == "d" || event.key == " ") {
    currentKey = event.key;
	}
});

document.addEventListener("keyup", function(event) {
    if (event.key == currentKey) {
        currentKey = "none";
    }
});
// END CONTROLS //


// BEGIN GAME CODE //
// BEGIN GLOBAL VARIABLES //
var maxLives = 5;
var lives = maxLives;
livesLabel.innerHTML = "Lives: " + lives.toString();
var gameOver = false;
var currentKey = "none";
var difficulty = 1; // does not currently influence anything
var numberOfColumns = 11;
var numberOfRows = 6;
var brickMargin = 0; // space between brickarray and edge of screen
var brickPadding = 0; // space between bricks
var brickWidth = canvas.width/numberOfColumns;
var brickHeight = 35; // height of each brick
var brickList = []; // array of all bricks, used for iteration
var resetAmount = 30;
var resetTimer = resetAmount; // after being reset, freezes paddle temporarily
var infoTimer = 150;
// END GLOBAL VARIABLES //


// BEGIN CALC FUNCTIONS //
function randomIntFromRange(min,max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
// END CALC FUNCTIONS //


// BEGIN GAME OBJECTS //
function Paddle() {
		// paddle's default location
		this.width = 160;
    this.height = 20;
    this.x = canvas.width/2;
    this.y = canvas.height - this.height/2;

    this.dx = 0; // x velocity
    this.dy = 0; // y velocity

    

    this.left = this.x - this.width/2; // left edge
    this.right = this.x + this.width/2; // right edge
    this.top = this.y - this.height/2; // top edge
    this.bottom = this.y + this.height/2; // bottom edge

    this.maxSpeed = 18; // speed caps
    this.acceleration = 6; // how much is added or subtracted to dx each tick,depending on if the paddle is being told to move or not
		this.friction = 3;

		this.reset = function() {
			this.x = canvas.width/2;
			this.y = canvas.height-this.height/2;
			this.dx = 0;
			this.dy = 0;
			
		}
    this.update = function() {
			if (resetTimer == 0) {
				this.checkInput();
			}
      this.changePos(this.x + this.dx, this.y + this.dy);
      debug.innerHTML = "X: " + Math.floor(this.x) + " | Speed: " + this.dx.toFixed(1) + " | Acceleration: " + this.acceleration;
      this.draw();
    }
    this.checkInput = function() {
        if (currentKey == "a" || currentKey == "A") {
            if (this.dx > -this.maxSpeed){
             this.dx -= this.acceleration;
            } else if (this.dx < -this.maxSpeed) {
                this.dx = -this.maxSpeed;
            }
        } else if (currentKey == "d" || currentKey == "D") {
            if (this.dx < this.maxSpeed) {
            this.dx += this.acceleration;
            } else if (this.dx > this.maxSpeed) {
                this.dx = this.maxSpeed;
            }
					
        } else if (currentKey == "none") {
            if (this.dx > 1) {
                this.dx -= this.acceleration;
            }
            else if (this.dx < -1) {
                this.dx += this.acceleration;
            }
            else {
                this.dx = 0;
            }
        }
        if (this.left + this.dx < 0) {
            this.x = this.width/2;
            this.dx = 0 //-this.dx - 5;
        } else if (this.right + this.dx > canvas.width) {
            this.x = canvas.width-this.width/2;
            this.dx = 0 //-this.dx + 5;
        }
    }
    this.changePos = function(x, y) {
        this.x = x;
        this.y = y;
        this.left = this.x - this.width/2;
        this.right = this.x + this.width/2;
        this.top = this.y - this.height/2;
        this.bottom = this.y + this.height/2;
    }
    this.draw = function() {
        c.beginPath();
        c.fillStyle = "#FF0000";
        c.rect(this.left, this.top, this.width, this.height);
        c.fill();
        c.closePath();
    }

}

function Brick(x, y) {
    this.x = x;
    this.y = y;
    this.width = brickWidth;
    this.height = brickHeight;
    this.color = "#0000ff";
    this.update = function() {
        c.beginPath();
        c.rect(this.x, this.y, this.width, this.height);
        c.fillStyle = this.color;
				c.strokeStyle = "#FFFFFF";
				c.lineWidth = 3;
				c.stroke();
        c.fill();
        c.closePath();
    }
}

function Ball() {
	this.initialize = function() {
			this.x = canvas.width/2;
			this.y = (canvas.height+brickHeight*numberOfRows) / 2;
			this.dx = 0;
			this.dy = 8;
			this.radius = 10;
		}

	// tests for collision with walls, blocks, and paddle
	this.testCollision = function() {
		// tests for screen edge collisions
		if (this.x+this.dx <= 0) { // left edge
			this.dx *= -1;
		}
		if (this.y+this.dy <= 0) { // top edge
			this.dy *= -1;
		}
		if (this.x+this.dx >= canvas.width) { // right edge
			this.dx *= -1;
		}
		if (this.y+this.dy >= canvas.height) { // bottom edge
			//this.dy *= -1;
			this.initialize();
			resetTimer = resetAmount;
			paddle.reset();
			lives -= 1;
			livesLabel.innerHTML = "Lives: " + lives.toString();
		}

		// checks for brick collision, uses center of ball as reference point
		for (let b = 0; b < brickList.length; b++) {
				var cb = brickList[b]; // current brick
				if (this.x+this.dx >= cb.x && this.x+this.dx <= cb.x+cb.width && this.y+this.dy >= cb.y && this.y+this.dy <= cb.y + cb.height) {
					
					if (this.x+this.dx <= cb.x || this.x+this.dx >= cb.x+cb.width) {
						this.dx *= -1;
					}

					if (this.y+this.dy >= cb.y || this.y+this.dy <= cb.y+cb.height) {
						this.dy *= -1;
					}
					
					brickList.splice(b, 1); // removes brick

			}
			
    }

		if (this.x+this.radius > paddle.left && this.x-this.radius+this.dx < paddle.right && this.y+this.radius > paddle.top && this.y-this.radius < paddle.bottom) {
			this.y = canvas.height - paddle.height -this.radius; // in the even that the ball hits hte side of the paddle, this prevents it from getting stuck inside
			this.dy *= -1;
			this.dx = randomIntFromRange(-this.radius, this.radius) + paddle.dx/paddle.friction; // transfers some of paddle's velocity to ball - whatever direction the paddle is moving in when it hits the ball, will influence the ball's velocity after bouncing. var friction determines how much paddle.dx influences ball.dx.
		} 
	}
		this.update = function() {
			if (resetTimer == 0) {
				this.x += this.dx;
				this.y += this.dy;
			}
			
			this.testCollision();
			c.beginPath();
			c.arc(this.x, this.y, this.radius, 0, Math.PI*2);
			c.strokeStyle = "#000000";
			c.stroke();
			c.closePath();
		}
}
// END GAME OBJECTS //


// BEGIN OBJECT INITIALIZATION
var paddle = new Paddle();
var ball = new Ball();
spawnBricks();
ball.initialize();
// END OBJECT INITIALIZATION //

// BEGIN GAME FUNCTIONS //
function spawnBricks() {
	brickList = [];
	this.totalWidth = numberOfColumns * (brickWidth + brickPadding) + brickPadding;
	this.startX = brickPadding;
	for (let r = 0; r < numberOfRows; r++) {
			for (let i = 0; i < numberOfColumns; i++) {
				brickList.push(new Brick(startX + (i * brickWidth) + (i*brickPadding), brickPadding +(r*brickHeight)+(r*brickPadding)));
		}
	}
}

function tick() {
	if (lives > 0 && brickList.length > 0) {
		c.clearRect(0, 0, canvas.width, canvas.height);
    paddle.update();
		ball.update();
    for (let b = 0; b < brickList.length; b++) {
        brickList[b].update();
    }
    if (resetTimer > 0) {
			resetTimer -= 1;
		}
		if (infoTimer > 0) {
			infoTimer -= 1;
			if (info.style.opacity != "1" && info.style.visibility != "visible") {
				info.style.opacity = "1";
				info.style.visibility = "visible";	
			}
				
		} else {
			info.style.opacity = "0";
			info.style.visibility = "hidden";
		}
	} else {
		if (!gameOver) { // shows game over screen
			c.beginPath();
			c.globalAlpha = 0.8;
			c.fillStyle = "#FFFFFF"
			c.fillRect(0, 0, canvas.width, canvas.height);
			c.closePath();
			
			if(brickList.length == 0) {
				gameOverLabel.innerHTML = "YOU WIN!";
			} else if (lives == 0) {
				gameOverLabel.innerHTML = "YOU LOSE."
			}
			gameOverMenu.style.display = "block";
			gameOver = true;
		} else {
			if (currentKey == " ") {
				resetGame();
			}
		}
	}
}

function resetGame() {
	lives = 5;
	livesLabel.innerHTML = "Lives: " + lives.toString();
	gameOverMenu.style.display = "none";
	gameOver = false;
	c.globalAlpha = 1.0;
	brickList = [];
	spawnBricks();
	ball.initialize();
	infoTimer = 150;
	info.style.opacity = "1";
	info.style.visibility = "visible";
	paddle.reset();
}
// END GAME FUNCTIONS // 
// END GAME CODE //


// BEGIN RUNTIME //

setInterval(tick, 16);

// END RUNTIME //
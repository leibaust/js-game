// HTML5 Canvas API
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// DOM Elements
const healthSpan = document.getElementById("health");
const scoreSpan = document.getElementById("score");
const highScoreSpan = document.getElementById("high-score");
const playAgainBtn = document.getElementById("play-again-btn");
const changeModeBtn = document.getElementById("change-mode");
const modeSelection = document.getElementById('mode-btns');
const easyMode = document.getElementById("easy-mode");
const medMode = document.getElementById("med-mode");
const hardMode = document.getElementById("hard-mode");
const hellMode = document.getElementById("hell-mode");
const gameBoard = document.getElementById("game-board");
const splashScreen = document.getElementById("splash");

// Game Variables
let player;
let enemies;
let projectiles;
let score;
let highScore = 0;
let shootInterval;
let enemyInterval;
// Setting the default mode
let currentMode = null;
// Global variable to track animation frame
let animationFrameId;
let lastShotTime = 0;
const SHOOT_COOLDOWN = 500; // Milliseconds between shots

// Images
const playerImage = new Image();
playerImage.src = "assets/player.png";

const enemyImage = [
  new Image(),
  new Image(),
  new Image(),
];

enemyImage[0].src = "assets/enemy1.png";
enemyImage[1].src = "assets/enemy2.png";
enemyImage[2].src = "assets/enemy3.png";

const projectileImage = new Image();
projectileImage.src = "assets/projectile.png";

// Sounds
const enemyHit = new Audio("assets/enemy-hit.mp3");
const playerHit = new Audio("assets/player-hit.mp3");
const gameOver = new Audio("assets/game-over.mp3");
const gameMusic = new Audio("assets/bgMusic.mp3");

// Functions



function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.size, player.size);
}

function updatePlayer() {
  player.x += player.direction.x * player.speed;
  player.y += player.direction.y * player.speed;

  if (player.direction.x !== 0 || player.direction.y !== 0) {
    player.lastDirection.x = player.direction.x;
    player.lastDirection.y = player.direction.y;
  }

  if (player.x < 0) {
    player.x = canvas.width;
  } else if (player.x > canvas.width) {
    player.x = 0;
  }
  if (player.y < 0) {
    player.y = canvas.height;
  } else if (player.y > canvas.height) {
    player.y = 0;
  }
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.image) {
      const randomEnemy = enemyImage[Math.floor(Math.random() * enemyImage.length)];
      enemy.image = randomEnemy;
    }
    ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.size, enemy.size);
  });
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.x += enemy.direction.x * enemy.speed;
    enemy.y += enemy.direction.y * enemy.speed;

    if (enemy.x <= 0 || enemy.x + enemy.size >= canvas.width) {
      enemy.direction.x *= -1;
    }
    if (enemy.y <= 0 || enemy.y + enemy.size >= canvas.height) {
      enemy.direction.y *= -1;
    }
  });
}

function findNearestEnemy(player, enemies) {
  let nearestEnemy = null;
  let minDistance = Infinity;

  enemies.forEach(enemy => {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
      }
  });

  return nearestEnemy;
}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.drawImage(projectileImage, 
            projectile.x, 
            projectile.y, 
            projectile.size, 
            projectile.size
        );
    });
}

function updateProjectiles() {
    for(let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].x += projectiles[i].direction.x;
        projectiles[i].y += projectiles[i].direction.y;
        
        // Remove if out of bounds
        if (projectiles[i].x < 0 || projectiles[i].x > canvas.width ||
            projectiles[i].y < 0 || projectiles[i].y > canvas.height) {
            projectiles.splice(i, 1);
        }
    }
}

function spawnEnemy() {
  let enemy = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 40,
    speed: 2,
    direction: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
  };
  enemies.push(enemy);
}

function isColliding(object1, object2) {
  return (
    object1.x < object2.x + object2.size &&
    object1.x + object1.size > object2.x &&
    object1.y < object2.y + object2.size &&
    object1.y + object1.size > object2.y
  );
}

function handleMovement(event) {
  switch (event.key) {
    case "ArrowUp":
      player.direction.y = -1;
      break;
    case "ArrowDown":
      player.direction.y = 1;
      break;
    case "ArrowLeft":
      player.direction.x = -1;
      break;
    case "ArrowRight":
      player.direction.x = 1;
      break;
  }
}

function stopMovement(event) {
  switch (event.key) {
    case "ArrowUp":
    case "ArrowDown":
      player.direction.y = 0;
      break;
    case "ArrowLeft":
    case "ArrowRight":
      player.direction.x = 0;
      break;
  }
}

function shootProjectile() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime < SHOOT_COOLDOWN) return;
    
    const nearestEnemy = findNearestEnemy(player, enemies);
    if (!nearestEnemy) return;

    // Calculate direction from center of player to center of enemy
    const dx = (nearestEnemy.x + nearestEnemy.size/2) - (player.x + player.size/2);
    const dy = (nearestEnemy.y + nearestEnemy.size/2) - (player.y + player.size/2);
    
    // Normalize the direction
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    const projectileSpeed = 7;
    
    const projectile = {
        x: player.x + player.size/2 - 5, // Center of player
        y: player.y + player.size/2 - 5, // Center of player
        size: 20,
        direction: {
            x: normalizedDx * projectileSpeed,
            y: normalizedDy * projectileSpeed
        }
    };

    projectiles.push(projectile);
    lastShotTime = currentTime;
}

function resetGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 2,
    direction: { x: 0, y: 0 }, 
    lastDirection: { x: 1, y: 0 },
    health: 100,
  };
  enemies = [];
  projectiles = [];
  score = 0;
  healthSpan.textContent = player.health;
  scoreSpan.textContent = score;
}

function gameLoop() {
  console.log("Game Loop is running");
  gameMusic.play();
  if (player.health <= 0) {
    if (score > highScore) {
      highScore = score;
      highScoreSpan.textContent = highScore;
    }
    gameOver.play();
    gameMusic.pause();
    gameMusic.currentTime = 0;
    setTimeout(() => {
      alert("Game Over! Your score is: " + score);
      clearInterval(shootInterval);
      clearInterval(enemyInterval);}, 500);
      
    return;
  }

  // Stops animation frame to prevent stacking game loops
  cancelAnimationFrame(animationFrameId);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  updateEnemies();
  drawEnemies();
  updateProjectiles();
  drawProjectiles();
  shootProjectile();

  enemies.forEach((enemy, enemyIndex) => {
    if (isColliding(player, enemy)) {
      player.health -= 10;
      healthSpan.textContent = player.health;
      enemies.splice(enemyIndex, 1);

      //Cloning the audio element to play the sound multiple times
      const clonePlayerHit = playerHit.cloneNode();
      clonePlayerHit.play();
    }

    projectiles.forEach((projectile, projectileIndex) => {
      if (isColliding(projectile, enemy)) {
        score += 10;
        scoreSpan.textContent = score;
        enemies.splice(enemyIndex, 1);
        projectiles.splice(projectileIndex, 1);
        const cloneEnemyHit = enemyHit.cloneNode();
        cloneEnemyHit.play();
      }
    });
  });
  animationFrameId = requestAnimationFrame(gameLoop);
}

function initGame() {
  cancelAnimationFrame(animationFrameId);
  resetGame();
  animationFrameId = requestAnimationFrame(gameLoop);
  gameLoop();

  window.addEventListener("keydown", handleMovement);
  window.addEventListener("keyup", stopMovement);

}

function changeMode() {
  splashScreen.style.display = "block";
  gameBoard.style.display = "none";
}

// Button Listeners
modeSelection.addEventListener("click", function () {
  cancelAnimationFrame(animationFrameId);
  const target = event.target;
  splashScreen.style.display = "none";
  gameBoard.style.display = "block";

  clearInterval(shootInterval);
  clearInterval(enemyInterval);

  if (target === easyMode) {
    currentMode = "easy";
    shootInterval = setInterval(shootProjectile, 150);
    enemyInterval = setInterval(spawnEnemy, 1500);
  } else if (target === medMode) {
    currentMode = "medium";
    shootInterval = setInterval(shootProjectile, 250);
    enemyInterval = setInterval(spawnEnemy, 1000);
  } else if (target === hardMode) {
    currentMode = "hard";
    shootInterval = setInterval(shootProjectile, 500);
    enemyInterval = setInterval(spawnEnemy, 500);
  } else if (target === hellMode) {
    currentMode = "hell";
    shootInterval = setInterval(shootProjectile, 500);
    enemyInterval = setInterval(spawnEnemy, 100);
  }
  gameMusic.pause();
  gameMusic.currentTime = 0;
  initGame();
});

playAgainBtn.addEventListener("click", function () {
  cancelAnimationFrame(animationFrameId);
  clearInterval(shootInterval); 
  clearInterval(enemyInterval); 
  if (currentMode === 'easy') { 
    shootInterval = setInterval(shootProjectile, 100); 
    enemyInterval = setInterval(spawnEnemy, 1500); 
  } else if (currentMode === 'medium') { 
    shootInterval = setInterval(shootProjectile, 250); 
    enemyInterval = setInterval(spawnEnemy, 1000); 
  } else if (currentMode === 'hard') { 
    shootInterval = setInterval(shootProjectile, 500); 
    enemyInterval = setInterval(spawnEnemy, 500); 
  } else if (currentMode === 'hell') { 
    shootInterval = setInterval(shootProjectile, 500); 
    enemyInterval = setInterval(spawnEnemy, 100); 
  }
  gameMusic.pause();
  gameMusic.currentTime = 0;
  initGame();
});

changeModeBtn.addEventListener("click", function () {
  gameMusic.pause();
  gameMusic.currentTime = 0;
  cancelAnimationFrame(animationFrameId);
  changeMode();
});

// Prevents scrolling with arrow keys
document.addEventListener('keydown', function(event) { 
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault(); } 
  });

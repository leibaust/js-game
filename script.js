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
// Setting the default mode to null for debugging purposes
let currentMode = null;

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
const menuMusic = new Audio("assets/menu-music.mp3");


// Functions
function resetGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 5,
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

function drawProjectiles() {
  projectiles.forEach((projectile) => {
    ctx.drawImage(projectileImage, projectile.x, projectile.y, projectile.size, projectile.size);
  });
}

function updateProjectiles() {
  projectiles.forEach((projectile, index) => {
    projectile.x += projectile.direction.x * projectile.speed;
    projectile.y += projectile.direction.y * projectile.speed;

    if (
      projectile.x < 0 ||
      projectile.x > canvas.width ||
      projectile.y < 0 ||
      projectile.y > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
  });
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

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.size &&
    rect1.x + rect1.size > rect2.x &&
    rect1.y < rect2.y + rect2.size &&
    rect1.y + rect1.size > rect2.y
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
  let projectile = {
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
    size: 15,
    speed: 10,
    direction: { x: player.lastDirection.x, y: player.lastDirection.y },
  };
  projectiles.push(projectile);
}

function gameLoop() {
  if (player.health <= 0) {
    if (score > highScore) {
      highScore = score;
      highScoreSpan.textContent = highScore;
    }
    gameOver.play();
    setTimeout(() => {
      alert("Game Over! Your score is: " + score);
      // playAgainBtn.style.display = "block";
      // changeModeBtn.style.display = "block";
      clearInterval(shootInterval);
      clearInterval(enemyInterval);}, 200);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  updateEnemies();
  drawEnemies();
  updateProjectiles();
  drawProjectiles();

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
  requestAnimationFrame(gameLoop);
}

function initGame() {
  resetGame();
  gameLoop();

  window.addEventListener("keydown", handleMovement);
  window.addEventListener("keyup", stopMovement);
}

function changeMode() {
  splashScreen.style.display = "block";
  gameBoard.style.display = "none";
  resetGame();
}

//Event Listeners
modeSelection.addEventListener("click", function () {
  const target = event.target;
  splashScreen.style.display = "none";
  gameBoard.style.display = "block";

  clearInterval(shootInterval);
  clearInterval(enemyInterval);

  if (target === easyMode) {
    currentMode = "easy";
    shootInterval = setInterval(shootProjectile, 100);
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
  initGame();
});

playAgainBtn.addEventListener("click", function () {

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

  // playAgainBtn.style.display = "none";
  // changeModeBtn.style.display = "none";
  initGame();
});

changeModeBtn.addEventListener("click", function () {
  // playAgainBtn.style.display = "none";
  // changeModeBtn.style.display = "none";
  changeMode();
});

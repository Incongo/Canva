const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 🧠 Marcador dinámico
const infoDiv = document.createElement("div");
infoDiv.id = "info";
infoDiv.style.position = "absolute";
infoDiv.style.top = "10px";
infoDiv.style.left = "50%";
infoDiv.style.transform = "translateX(-50%)";
infoDiv.style.color = "#33ff00";
infoDiv.style.fontFamily = "Arial, sans-serif";
infoDiv.style.fontSize = "18px";
infoDiv.style.background = "rgba(0,0,0,0.5)";
infoDiv.style.padding = "6px 12px";
infoDiv.style.borderRadius = "8px";
infoDiv.innerHTML = '<span id="score">Puntuación: 0</span> | <span id="lives">Vidas: 5</span>';
document.body.appendChild(infoDiv);

// 🎨 Cargar sprite de emojis (5 columnas × 4 filas = 20 emojis)
const emojiSprite = new Image();
emojiSprite.src = "img/emojis.png"; // coloca tu imagen en /img/emojis.png
const emojiCols = 6;
const emojiRows = 4;
let emojiWidth, emojiHeight;
let emojiIndex = Math.floor(Math.random() * (emojiCols * emojiRows));

// 🎮 Estado del juego
let score = 0;
let lives = 5;

// 🧱 Configuración
const brickRowCount = 5;
const brickColumnCount = 7;
let bricks = [];
let brickWidth, brickHeight, brickPadding = 10;
let brickOffsetTop = 60;
let brickOffsetLeft;

// 🏓 Raqueta y pelota
let paddleHeight, paddleWidth, paddleX;
let ballRadius, x, y, dx, dy;

// ⌨️ Controles
let rightPressed = false;
let leftPressed = false;

// 📱 Táctil
canvas.addEventListener("touchmove", e => {
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddleX = touchX - paddleWidth / 2;
  paddleX = Math.min(Math.max(0, paddleX), canvas.width - paddleWidth);
  e.preventDefault();
}, { passive: false });

// ⌨️ Teclado
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === "Right") rightPressed = true;
  if (e.key === "ArrowLeft" || e.key === "Left") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight" || e.key === "Right") rightPressed = false;
  if (e.key === "ArrowLeft" || e.key === "Left") leftPressed = false;
});

// 🔄 Inicializar ladrillos
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

// 📐 Recalcular dimensiones
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  paddleHeight = 12;
  paddleWidth = Math.max(60, canvas.width * 0.15);
  if (typeof paddleX !== "number") {
    paddleX = (canvas.width - paddleWidth) / 2;
  } else {
    paddleX = Math.min(Math.max(0, paddleX), canvas.width - paddleWidth);
  }

  ballRadius = Math.max(10, canvas.width * 0.015);
  if (typeof x !== "number" || typeof y !== "number") {
    x = canvas.width / 2;
    y = canvas.height - 40;
  }

  // Velocidad inicial razonable
  if (typeof dx !== "number" || typeof dy !== "number") {
    dx = 3;
    dy = -3;
  }

  brickWidth = Math.max(40, canvas.width * 0.1);
  brickHeight = 20;
  const totalBricksWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;
}

window.addEventListener("resize", resizeCanvas);

// 🎨 Dibujar ladrillos
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#33ff00";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// 😄 Dibujar bola con emoji (recorte calculado tras onload)
function drawBall() {
  if (!emojiWidth || !emojiHeight) return; // esperar a que cargue el sprite
  const col = emojiIndex % emojiCols;
  const row = Math.floor(emojiIndex / emojiCols);
  ctx.drawImage(
    emojiSprite,
    col * emojiWidth, row * emojiHeight, emojiWidth, emojiHeight, // recorte del sprite
    x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2 // destino (bola)
  );
}

// 🏓 Dibujar raqueta
function drawPaddle() {
  const py = canvas.height - paddleHeight - 10;
  ctx.beginPath();
  ctx.rect(paddleX, py, paddleWidth, paddleHeight);
  ctx.fillStyle = "#33ff00";
  ctx.fill();
  ctx.closePath();
}

// 💥 Colisiones con ladrillos
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score++;
          document.getElementById("score").textContent = "Puntuación: " + score;
          if (score === brickRowCount * brickColumnCount) {
            alert("🎉 ¡Has ganado!");
            document.location.reload();
          }
        }
      }
    }
  }
}

// ⚙️ Física y rebotes
function updatePhysics() {
  // Paredes laterales y techo
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;

  // Suelo y raqueta
  const paddleY = canvas.height - paddleHeight - 10;
  if (y + dy > paddleY - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      // Ángulo según impacto
      const hit = (x - paddleX) / paddleWidth - 0.5; // -0.5..0.5
      const angle = hit * Math.PI / 3; // apertura ±60°
      const speed = Math.max(4, Math.hypot(dx, dy));
      dx = speed * Math.sin(angle);
      dy = -Math.abs(speed * Math.cos(angle));
      y = paddleY - ballRadius - 1;

      // Cambiar emoji en cada rebote con la raqueta
      emojiIndex = Math.floor(Math.random() * (emojiCols * emojiRows));
    } else if (y + dy > canvas.height - ballRadius) {
      lives--;
      document.getElementById("lives").textContent = "Vidas: " + lives;
      if (!lives) {
        alert("💀 Game Over");
        document.location.reload();
      } else {
        // Reset de bola
        x = canvas.width / 2;
        y = canvas.height - 40;
        dx = 3;
        dy = -3;
        paddleX = (canvas.width - paddleWidth) / 2;
        // Cambiar emoji también al perder vida
        emojiIndex = Math.floor(Math.random() * (emojiCols * emojiRows));
      }
    }
  }

  x += dx;
  y += dy;
}

// ⌨️ Movimiento raqueta
function updatePaddle() {
  const speed = 7;
  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += speed;
  if (leftPressed && paddleX > 0) paddleX -= speed;
}

// 🔁 Bucle principal
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();
  updatePhysics();
  updatePaddle();
  requestAnimationFrame(draw);
}

// 🟢 Iniciar cuando el sprite cargue
emojiSprite.onload = () => {
  emojiWidth = emojiSprite.width / emojiCols;
  emojiHeight = emojiSprite.height / emojiRows;
  initBricks();
  resizeCanvas();
  draw();
};

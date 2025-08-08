const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const worldSize = 5000;
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

class Ball {
    constructor(x, y, radius, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.isPlayer = isPlayer;
        this.updateSpeed();
    }

    updateSpeed() {
        const baseSpeed = 20;
        this.speed = baseSpeed / this.radius + 0.5;
        if (this.isPlayer) this.speed *= 5;  // jogador com dobro da velocidade
    }

    limitSize() {
        this.radius = Math.min(this.radius, 1000);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isPlayer) {
            ctx.fillStyle = "#000"; // preto jogador
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#fff"; // borda branca
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.stroke();
        }

        // Texto central branco para todos
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.max(this.radius * 0.8, 10)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.floor(this.radius), this.x, this.y);
    }

    moveTowards(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    updateAI(balls) {
        let target = null;
        let minDist = Infinity;
        for (let b of balls) {
            if (b === this || b.radius >= this.radius) continue;
            const d = distance(this, b);
            if (d < minDist) {
                minDist = d;
                target = b;
            }
        }
        if (target) this.moveTowards(target);
    }
}

const player = new Ball(worldSize / 2, worldSize / 2, 20, "black", true);
const balls = [player];

function spawnFood() {
    balls.push(new Ball(rand(0, worldSize), rand(0, worldSize), rand(5, 15), `hsl(${rand(0, 360)}, 70%, 60%)`));
}

// Inicial
for (let i = 0; i < 50; i++) spawnFood();
for (let i = 0; i < 10; i++) {
    balls.push(new Ball(rand(0, worldSize), rand(0, worldSize), rand(15, 30), "orange"));
}

function handleInput() {
    let dx = 0, dy = 0;
    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
        dx /= len;
        dy /= len;
        player.x += dx * player.speed;
        player.y += dy * player.speed;
        player.x = Math.max(0, Math.min(worldSize, player.x));
        player.y = Math.max(0, Math.min(worldSize, player.y));
    }
}

function gameLoop() {
    handleInput();

    // IA inimiga
    for (let ball of balls) {
        if (!ball.isPlayer && ball.color === "orange") {
            ball.updateAI(balls);
        }
    }

    // Colisões
    for (let i = balls.length - 1; i >= 0; i--) {
        const b1 = balls[i];
        for (let j = balls.length - 1; j >= 0; j--) {
            if (i === j) continue;
            const b2 = balls[j];
            const d = distance(b1, b2);
            if (d < b1.radius + b2.radius && b1.radius > b2.radius) {
                if (b2.isPlayer) {
                    // Jogador comido → renasce
                    b1.radius += b2.radius;
                    b1.limitSize();
                    b1.updateSpeed();
                    player.x = rand(0, worldSize);
                    player.y = rand(0, worldSize);
                    player.radius = 20;
                    player.updateSpeed();
                } else if (b1.isPlayer) {
                    // Jogador come bola
                    player.radius += b2.radius;
                    player.limitSize();
                    player.updateSpeed();
                    balls.splice(j, 1);
                    if (j < i) i--;
                } else {
                    // IA come bola
                    b1.radius += b2.radius;
                    b1.limitSize();
                    b1.updateSpeed();
                    balls.splice(j, 1);
                    if (j < i) i--;
                }
            }
        }
    }

    // Gerar comida se estiver abaixo do limite
    const foodCount = balls.filter(b => !b.isPlayer && b.color !== "orange").length;
    if (foodCount < 130) spawnFood();

    // Câmera
    const zoom = Math.min(2, 60 / player.radius + 0.5);
    const offsetX = player.x - canvas.width / (2 * zoom);
    const offsetY = player.y - canvas.height / (2 * zoom);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, -offsetX * zoom, -offsetY * zoom);

    // Fundo com grade
    ctx.strokeStyle = "#222";
    for (let x = 0; x < worldSize; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldSize);
        ctx.stroke();
    }
    for (let y = 0; y < worldSize; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldSize, y);
        ctx.stroke();
    }

    // Desenho
    for (let b of balls) b.draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();
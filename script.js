(function() {
    const canvas = document.getElementById("pm-game");
    const ctx = canvas.getContext("2d");

    // Prevent scrolling when playing
    window.addEventListener("keydown", (e) => {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    });

    /* VARIABLES */
    let w = canvas.width, h = canvas.height, mode = "TITLE";
    let px = 100, py = 200, vx = 0, vy = 0;
    let jumpCount = 0, lastDir = 1, camX = 0;
    let bullets = [], enemyBullets = [], enemies = [], coins = [], platforms = [];
    let ks = {}, score = 0, money = 0, health = 5, shootCooldown = 0;
    let lastPlatform = -1, leaderboard = parseInt(localStorage.getItem("chiko_best")) || 0;
    let currentGun = "Baby Gun", gunOut = false, runAnim = 0, shopOpen = false;
    let level = 1, platformsCleared = 0;

    /* ASSETS */
    let playAsChikorita = false;
    const chikoSprite = new Image();
    chikoSprite.crossOrigin = "anonymous";
    chikoSprite.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/152.png";

    const enemySprites = [];
    [4, 7, 25, 94].forEach(id => {
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        enemySprites.push(img);
    });

    const guns = {
        "Baby Gun": { speed: 11, spread: 1, cost: 0 },
        "smg": { speed: 9.6, spread: 1, cost: 5 },
        "shotgun": { speed: 8.4, spread: 3, cost: 8 },
        "rifle": { speed: 15.6, spread: 1, cost: 12 },
        "sniper": { speed: 24, spread: 1, cost: 18 },
        "minigun": { speed: 13.2, spread: 1, cost: 100 }
    };

    function reset() {
        px = 100; py = 200; vx = 0; vy = 0;
        score = 0; money = 0; health = 5; level = 1; platformsCleared = 0;
        bullets = []; enemyBullets = []; enemies = []; coins = []; 
        platforms = [{ x: 0, y: h - 150, w: 1000, id: 0 }];
        lastPlatform = -1; currentGun = "Baby Gun"; gunOut = false; shopOpen = false;
        mode = "PLAYING";
        canvas.focus();
    }

    canvas.onkeydown = e => {
        ks[e.code] = true;
        if (mode === "TITLE" && e.code === "Enter") reset();
        if (mode === "PLAYING") {
            if (e.code === "ShiftLeft") gunOut = !gunOut;
            if ((e.code === "Space" || e.code === "ArrowUp") && jumpCount < 2 && !shopOpen) { vy = -12; jumpCount++; }
            if (e.code === "KeyB") shopOpen = !shopOpen;
            if (e.code === "KeyC") playAsChikorita = !playAsChikorita;
            if (gunOut && !shopOpen && e.code === "Digit1" && shootCooldown <= 0) {
                let g = guns[currentGun];
                for (let i = 0; i < g.spread; i++) {
                    bullets.push({ x: px + 20, y: py + 20 + (i - (g.spread - 1) / 2) * 3, vx: lastDir * g.speed });
                }
                shootCooldown = (currentGun === "minigun") ? 2 : (currentGun === "smg" ? 5 : 12);
            }
            if (shopOpen) {
                const keys = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"];
                const weaponNames = ["smg", "shotgun", "rifle", "sniper", "minigun"];
                keys.forEach((key, i) => {
                    let wpn = weaponNames[i];
                    if (e.code === key && money >= guns[wpn].cost) { currentGun = wpn; money -= guns[wpn].cost; }
                });
            }
        }
        if (mode === "GAMEOVER" && e.code === "Enter") reset();
    };
    canvas.onkeyup = e => ks[e.code] = false;
    canvas.onclick = () => { canvas.focus(); if (mode !== "PLAYING") reset(); };

    function drawPlayer(x, y) {
        ctx.save();
        ctx.translate(x + 20, y + 30);
        if (lastDir === -1) ctx.scale(-1, 1);
        if (playAsChikorita) {
            ctx.drawImage(chikoSprite, -100, -115, 200, 200);
            if (gunOut) {
                ctx.strokeStyle = "#2d5a27"; ctx.lineWidth = 6; ctx.strokeRect(0, -10, 55, 1);
                ctx.strokeStyle = "#FFF"; ctx.lineWidth = 8; ctx.strokeRect(55, -10, 40, 1);
            }
        } else {
            ctx.strokeStyle = "#0F0"; ctx.lineWidth = 4;
            let swing = Math.sin(runAnim) * 4.8;
            ctx.beginPath();
            ctx.moveTo(0, -10); ctx.lineTo(0, 15);
            ctx.moveTo(0, -5); ctx.lineTo(10, 10 + swing);
            ctx.moveTo(0, -5); ctx.lineTo(-10, 10 - swing);
            ctx.moveTo(0, 15); ctx.lineTo(10, 30 - swing);
            ctx.moveTo(0, 15); ctx.lineTo(-10, 30 + swing);
            ctx.stroke();
            ctx.fillStyle = "#0F0"; ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI * 2); ctx.fill();
            if (gunOut) { ctx.strokeStyle = "#FFF"; ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(30, 10); ctx.stroke(); }
        }
        ctx.restore();
    }

    function loop() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, w, h); // Sky
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(w - 100, 80, 40, 0, Math.PI * 2); ctx.fill(); // Sun
        
        ctx.fillStyle = "#228B22"; // Parallax Hills
        for (let i = -1; i < 3; i++) {
            ctx.beginPath(); ctx.arc((i * 600) - ((camX * 0.2) % 600) + 300, h, 400, 0, Math.PI, true); ctx.fill();
        }

        if (mode === "TITLE") {
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, w, h);
            ctx.textAlign = "center"; ctx.fillStyle = "#0F0"; ctx.font = "40px Courier New";
            ctx.fillText("CHIKORITA UNIVERSE", w / 2, h / 2 - 20);
            ctx.fillStyle = "#FFF"; ctx.font = "20px Courier New";
            ctx.fillText("CLICK TO START", w / 2, h / 2 + 40);
        } else if (mode === "PLAYING") {
            if (!shopOpen) {
                if (ks.ArrowLeft) { vx -= 1.0; lastDir = -1; }
                if (ks.ArrowRight) { vx += 1.0; lastDir = 1; }
                vx *= 0.9; vy += 0.6; px += vx; py += vy; runAnim += Math.abs(vx) * 0.03;
                camX += (px - camX - w / 4) * 0.1;
                if (shootCooldown > 0) shootCooldown--;
            }

            if (platforms[platforms.length - 1].x < px + w) {
                let last = platforms[platforms.length - 1];
                let pX = last.x + last.w + 200 + Math.random() * (300 + level * 50);
                let pW = Math.max(100, 400 - level * 20);
                platforms.push({ x: pX, y: h - 150, w: pW, id: platforms.length });
                if (Math.random() > 0.4) enemies.push({ x: pX + pW / 2, y: h - 190, hp: 3 + level, active: true, minX: pX, maxX: pX + pW, eVx: 1.5 + level * 0.2, eCooldown: 60, spriteId: Math.floor(Math.random() * enemySprites.length) });
            }

            ctx.save(); ctx.translate(-camX, 0);
            platforms.forEach(p => {
                ctx.fillStyle = "#8B4513"; ctx.fillRect(p.x, p.y, p.w, h - p.y);
                ctx.fillStyle = "#32CD32"; ctx.fillRect(p.x, p.y, p.w, 15);
                if (vy > 0 && px + 30 > p.x && px < p.x + p.w && py + 60 >= p.y && py + 60 <= p.y + 40) {
                    py = p.y - 60; vy = 0; jumpCount = 0;
                    if (lastPlatform !== p.id) { score++; lastPlatform = p.id; platformsCleared++; if (platformsCleared % 10 === 0) { level++; health++; } }
                }
            });

            enemies.forEach(e => {
                if (!e.active) return;
                if (!shopOpen) {
                    e.x += e.eVx; if (e.x < e.minX || e.x > e.maxX) e.eVx *= -1;
                    e.eCooldown--; if (e.eCooldown <= 0 && Math.abs(px - e.x) < 500) {
                        enemyBullets.push({ x: e.x, y: e.y + 20, vx: (px < e.x ? -1 : 1) * (6 + level) });
                        e.eCooldown = 80 - level * 2;
                    }
                }
                ctx.save(); ctx.translate(e.x, e.y); if (e.eVx < 0) ctx.scale(-1, 1);
                if (enemySprites[e.spriteId]?.complete) ctx.drawImage(enemySprites[e.spriteId], -40, -40, 80, 80);
                ctx.restore();
            });

            drawPlayer(px, py);

            bullets.forEach((b, i) => {
                b.x += b.vx; ctx.fillStyle = playAsChikorita ? "#2d5a27" : "#FFF"; ctx.fillRect(b.x, b.y, 10, 5);
                enemies.forEach(e => { if (e.active && b.x > e.x - 30 && b.x < e.x + 30 && b.y > e.y - 30 && b.y < e.y + 30) { e.hp--; if (e.hp <= 0) e.active = false; bullets.splice(i, 1); score += 10; money++; } });
            });

            enemyBullets.forEach((eb, i) => {
                eb.x += eb.vx; ctx.fillStyle = "#F00"; ctx.fillRect(eb.x, eb.y, 10, 5);
                if (eb.x > px && eb.x < px + 40 && eb.y > py && eb.y < py + 60) { health--; enemyBullets.splice(i, 1); }
            });

            ctx.restore();

            if (py > h || health <= 0) mode = "GAMEOVER";
            ctx.fillStyle = "#000"; ctx.textAlign = "left"; ctx.font = "18px Courier New";
            ctx.fillText(`LVL:${level} SCORE:${score} COINS:${money} HP:${health}`, 20, 30);
            if (shopOpen) {
                ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(200, 100, 600, 400);
                ctx.fillStyle = "#000"; ctx.textAlign = "center"; ctx.fillText("SHOP - Press 1-5 to Buy", w / 2, 150);
                Object.keys(guns).forEach((g, i) => ctx.fillText(`${i + 1}. ${g} (${guns[g].cost} coins)`, w / 2, 200 + i * 40));
            }
        } else {
            ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#F00"; ctx.textAlign = "center"; ctx.font = "40px Courier New"; ctx.fillText("GAME OVER", w / 2, h / 2);
            ctx.fillStyle = "#FFF"; ctx.font = "20px Courier New"; ctx.fillText("PRESS ENTER TO RESTART", w / 2, h / 2 + 50);
        }
        requestAnimationFrame(loop);
    }
    loop();
})();
const player = document.getElementById("player");
const obstacle = document.getElementById("obstacle");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("start-menu");
const bgm = document.getElementById("bgm");
const scoreElement = document.getElementById("score");

let score = 0;
let isPlaying = false;

// 1. Start Game & Play Music
startButton.addEventListener("click", () => {
    isPlaying = true;
    startMenu.style.display = "none";
    score = 0;
    
    // Play the Absol music
    bgm.play();

    // Start obstacle movement
    moveObstacle();
});

// 2. Jump Logic
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !player.classList.contains("jump")) {
        player.classList.add("jump");
        setTimeout(() => player.classList.remove("jump"), 500);
    }
});

// 3. Game Loop
function moveObstacle() {
    if (!isPlaying) return;

    let obstaclePos = 600;
    
    const interval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(interval);
            return;
        }

        obstaclePos -= 5;
        if (obstaclePos < -20) {
            obstaclePos = 600;
            score++;
            scoreElement.innerText = "Score: " + score;
        }
        obstacle.style.left = obstaclePos + "px";

        // Collision Detection
        let playerTop = parseInt(window.getComputedStyle(player).getPropertyValue("top"));
        let obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue("left"));

        if (obstacleLeft < 90 && obstacleLeft > 50 && playerTop >= 160) {
            alert("Game Over! Score: " + score);
            isPlaying = false;
            bgm.pause();
            bgm.currentTime = 0;
            location.reload(); // Restart
        }
    }, 10);
}
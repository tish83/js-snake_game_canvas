document.addEventListener("DOMContentLoaded", () => {
    const scoreField = document.querySelector("[data-score]");
    const maxScoreField = document.querySelector("[data-high-score]");
    let score = 0;
    let maxScore = 0;
    const canvas = document.getElementById("gameField");
    const ctx = canvas.getContext("2d");

    const cellSize = 20;
    let snake = [{ x: 0, y: 0 }]; // Początkowa pozycja węża
    let head = { x: snake[0].x, y: snake[0].y }; // Głowa węża
    let direction = "right"; // deklarujemy kierunek węża
    let nextDirection = direction; // Kolejny kierunek węża

    let lastMoveTimestamp;
    let moveInterval = 200; // Czas opóźnienia między ruchami węża w milisekundach

    let food = {};

    let gameStarted = false; // Flaga określająca, czy gra została rozpoczęta


    // Funkcja rysująca węża na planszy
    function drawSnake() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Wyczyszczenie planszy
        ctx.fillStyle = "green"; // Kolor węża
        snake.forEach(segment => {
            ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize); // Rysowanie komórki węża
        });
    }

    // Funkcja ruchu węża
    function moveSnake(timestamp) {
        if (!gameStarted) return; // Nie wykonuj ruchu, jeśli gra nie została jeszcze rozpoczęta
        if (!lastMoveTimestamp) lastMoveTimestamp = timestamp;
        const elapsedTime = timestamp - lastMoveTimestamp;

        // Jeśli upłynął wystarczający czas od ostatniego ruchu, wykonaj ruch węża
        if (elapsedTime > moveInterval) {
            lastMoveTimestamp = timestamp; // Zaktualizuj czas ostatniego ruchu

            // Zwiększaj wartość moveInterval z czasem, aby utrzymać stały poziom trudności w grze
            moveInterval += 0.05; // Możesz dostosować wartość wzrostu czasu

            // Sprawdź zmianę kierunku - zabezpiecza przed cofaniem węża przy naciśnięciu na raz 2 klawiszy
            if (nextDirection) {
                if ((nextDirection === "up" && direction !== "down") ||
                    (nextDirection === "down" && direction !== "up") ||
                    (nextDirection === "left" && direction !== "right") ||
                    (nextDirection === "right" && direction !== "left")) {
                    direction = nextDirection;
                }
                nextDirection = null;
            }

            // Aktualizacja pozycji głowy węża na podstawie kierunku
            switch (direction) {
                case "up":
                    head = { x: head.x, y: head.y - 1 };
                    break;
                case "down":
                    head = { x: head.x, y: head.y + 1 };
                    break;
                case "left":
                    head = { x: head.x - 1, y: head.y };
                    break;
                case "right":
                    head = { x: head.x + 1, y: head.y };
                    break;
            }
            
            // Sprawdź kolizję z samym sobą
            if (selfCollision()) {
                gameStarted = false; // Zatrzymaj grę
                ctx.fillStyle = "white";
                ctx.font = "24px Arial";
                ctx.textAlign = "center";
                ctx.fillText("Przegrałeś! Kolizja z samym sobą!", canvas.width / 2, (canvas.height / 2) - 30);
                return; // Przerwij funkcję moveSnake()
            }
            // Sprawdź kolizję z jedzeniem
            foodCollision();
            
            // Dodaj nową głowę węża na początek tablicy
            snake.unshift({ x: head.x, y: head.y });

            
        }

        requestAnimationFrame(moveSnake);
    }

    // Nasłuchiwanie na naciśnięcie klawisza Enter
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            if (!gameStarted) {
                // Rozpocznij grę, jeśli nie została jeszcze rozpoczęta
                gameStarted = true;
                // Zresetuj stan gry
                snake = [{ x: 0, y: 0 }];
                head = { x: snake[0].x, y: snake[0].y };
                direction = "right";
                nextDirection = direction;
                generateFood(); // Wygeneruj jedzenie
                gameLoop(); // Rozpocznij pętlę gry
            }
        } else {
            // Obsługa zmiany kierunku węża
            switch (event.key) {
                case "ArrowUp":
                    if (direction !== "down") {
                        nextDirection = "up";
                    }
                    break;
                case "ArrowDown":
                    if (direction !== "up") {
                        nextDirection = "down";
                    }
                    break;
                case "ArrowLeft":
                    if (direction !== "right") {
                        nextDirection = "left";
                    }
                    break;
                case "ArrowRight":
                    if (direction !== "left") {
                        nextDirection = "right";
                    }
                    break;
            }
        }
    });

    // Funkcja sprawdzająca kolizję z granicami planszy
    function boundaryCheck() {
        if (head.y < 0 || head.x < 0 || head.y >= canvas.height / cellSize || head.x >= canvas.width / cellSize) {
            gameStarted = false; // Zatrzymaj grę
            score = 0; // Zresetuj wynik gracza
            scoreField.innerHTML = `Wynik: ${score}`; // Aktualizuj pole wyniku na stronie
        
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Przegrałeś!", canvas.width / 2, (canvas.height / 2)-30);
        }
    }

    function selfCollision() {
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true; // Kolizja z samym sobą
            }
        }
        return false; // Brak kolizji
    }

    function foodCollision() {
        if (head.x === food.x && head.y === food.y) {
            generateFood(); // Generuj nowe jedzenie
            score++;
            scoreField.innerHTML = `Wynik: ${score}`;
            // Zmniejszam wartość moveInterval, aby przyspieszyć węża
            moveInterval -= 5; // Możesz dostosować wartość zmniejszenia szybkości
            // Aktualizacja maxScore
            if (score > maxScore) {
                maxScore = score;
                maxScoreField.innerHTML = `Najlepszy wynik: ${maxScore}`;
            }
        } else {
            // Usuń ostatni segment węża w normalnym ruchu, a jak trafia na jedzenie to nie usuwa ostatniego segmentu
            snake.pop();
        }
    }

    // Funkcja rysująca jedzenie na planszy
    function drawFood() {
        ctx.fillStyle = "red";
        ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);
    }

    // Funkcja generująca jedzenie na planszy
    function generateFood() {
        food.x = Math.floor(Math.random() * (canvas.width / cellSize));
        food.y = Math.floor(Math.random() * (canvas.height / cellSize));
    }

    // Funkcja aktualizująca stan gry
    function gameLoop() {
        moveSnake(); // Aktualizacja pozycji węża
        drawSnake(); // Aktualizacja planszy
        drawFood(); // Rysowanie jedzenia
        // Sprawdź kolizję z granicami planszy
        boundaryCheck();

        if (!gameStarted) {
            ctx.fillStyle = "white";
            ctx.font = "24px Arial"; // Zwiększenie rozmiaru czcionki
            ctx.textAlign = "center"; // Wyśrodkowanie tekstu
            ctx.fillText("Naciśnij Enter, aby rozpocząć grę", canvas.width / 2, canvas.height / 2); // Poprawienie pozycji tekstu
        }
        
        requestAnimationFrame(gameLoop); // Kontynuuj pętlę gry
    }

    // Rozpocznij grę
    generateFood(); // Wygeneruj jedzenie przed rozpoczęciem gry
    gameLoop();
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});


const validWords = ['яблоко','арбуз','зебра','олень','закат','трость','титан','нос','смысл','легко','овал'];
let usedWords = [];




// Middleware
app.use(cors());
app.use(express.json());

// Игровая логика
let games = {};


io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: user.id, username: user.username };
        } catch (err) {
            return next(new Error("Authentication error"));
        }
    } else {
        // Генерация уникального имени для гостя на основе socket.id
        const guestUsername = `Guest_${socket.id.substring(0, 6)}`; // Уникальное имя для гостя
        socket.user = { id: `guest_${socket.id}`, username: guestUsername };
    }

    next();
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on("join_game", (username) => {
        if (username) {
            socket.user.username = username;  // Присваиваем имя игроку
        }

        // Ищем доступную игру
        const availableGame = Object.values(games).find(
            (game) => game.player2 === null
        );

        if (availableGame) {
            availableGame.player2 = socket.user; // Присваиваем второго игрока
            availableGame.state = "started";
            availableGame.turn = availableGame.player1.username; // Первый ход делает player1
            availableGame.timer = 30;
            availableGame.usedWords = []; // Массив для слов, которые уже были использованы

            socket.join(availableGame.id); // Подключаем игрока к игре
            io.to(availableGame.id).emit("game_update", {
                log: [`Game started! ${availableGame.player1.username} vs ${availableGame.player2.username}`],
                players: [availableGame.player1.username, availableGame.player2.username],
                turn: availableGame.turn,
                timer: availableGame.timer,
            });

            startTimer(availableGame.id);
        } else {
            const gameId = `game_${socket.id}`;
            games[gameId] = {
                id: gameId,
                player1: socket.user,
                player2: null,
                state: "waiting",
                log: [],
                timer: 30,
                usedWords: [] // Массив для слов, которые уже были использованы
            };
            socket.join(gameId);

            socket.emit("waiting", { message: "Waiting for another player..." });
        }
    });

    socket.on("submit_word", (data) => {
        const { word } = data;
        const game = Object.values(games).find(
            (game) =>
                game.player1.id === socket.user.id ||
                (game.player2 && game.player2.id === socket.user.id)
        );

        if (!game || game.turn !== socket.user.username) return; // Игрок не должен отправлять слово, если не его ход

        // Проверка, существует ли слово в массиве validWords
        if (!validWords.includes(word)) {
            socket.emit("invalid_word", "No such word exists.");
            return;
        }

        // Проверка, не было ли уже введено это слово
        if (game.usedWords.includes(word)) {
            socket.emit("invalid_word", "You already used this word.");
            return;
        }

        // Если это не первый ход, проверяем, что слово начинается с последней буквы предыдущего слова
        if (game.usedWords.length > 0) {
            const lastWord = game.usedWords[game.usedWords.length - 1];
            const lastLetter = lastWord.charAt(lastWord.length - 1);
            if (word.charAt(0).toLowerCase() !== lastLetter.toLowerCase()) {
                socket.emit("invalid_word", `The word must start with '${lastLetter}'.`);
                return;
            }
        }

        // Добавляем слово в список использованных слов
        game.usedWords.push(word);

        // Логируем слово
        game.log.push(`${socket.user.username}: ${word}`);

        // Переключаем ход на следующего игрока
        game.turn = game.turn === game.player1.username ? game.player2.username : game.player1.username;
        game.timer = 30; // Сбрасываем таймер

        io.to(game.id).emit("game_update", {
            log: game.log,
            players: [game.player1.username, game.player2.username],
            turn: game.turn, // Обновляем текущего игрока
            timer: game.timer,
        });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.username}`);

        const gameId = Object.keys(games).find(
            (id) =>
                games[id].player1.id === socket.user.id ||
                (games[id].player2 && games[id].player2.id === socket.user.id)
        );

        if (gameId) {
            const game = games[gameId];
            delete games[gameId];

            io.to(gameId).emit("game_update", {
                log: [`Player ${socket.user.username} disconnected. Game ended.`],
            });
        }
    });

    const startTimer = (gameId) => {
        const interval = setInterval(() => {
            const game = games[gameId];
            if (!game || game.state !== "started") {
                clearInterval(interval);
                return;
            }

            game.timer -= 1;

            if (game.timer === 0) {
                const loser = game.turn === game.player1.username ? game.player1.username : game.player2.username;
                io.to(gameId).emit("game_over", { message: `${loser} ran out of time!` });
                delete games[gameId];
                clearInterval(interval);
            } else {
                io.to(game.id).emit("timer_update", { timer: game.timer });
            }
        }, 1000);
    };
});



// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

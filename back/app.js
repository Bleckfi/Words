require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const { registerUser, loginUser } = require("./auth");
const pool = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Маршруты для авторизации
app.post("/register", registerUser);
app.post("/login", loginUser);

// Игровая логика
let games = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user; // Привязка данных пользователя
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on("join_game", () => {
        // Найти или создать новую игру
        const availableGame = Object.values(games).find(
            (game) => game.player2 === null
        );

        if (availableGame) {
            // Присоединить второго игрока
            availableGame.player2 = socket.user;
            availableGame.state = "started";

            io.to(availableGame.id).emit("game_update", {
                log: ["Game started!"],
                timer: 30,
            });
        } else {
            // Создать новую игру
            const gameId = `game_${socket.id}`;
            games[gameId] = { id: gameId, player1: socket.user, player2: null, state: "waiting" };
            socket.join(gameId);
            socket.emit("waiting", { message: "Waiting for another player..." });
        }
    });

    socket.on("submit_word", (data) => {
        const { word } = data;
        const game = Object.values(games).find(
            (game) => game.player1.id === socket.user.id || game.player2?.id === socket.user.id
        );

        if (!game) return;

        // Добавьте свою логику проверки слов и окончания игры
        game.log = game.log || [];
        game.log.push(`${socket.user.username} submitted: ${word}`);

        io.to(game.id).emit("game_update", {
            log: game.log,
            timer: 30, // Сбрасываем таймер
        });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.username}`);
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(cors({
    origin: "http://localhost:3000", // Адрес вашего фронтенда
    methods: ["GET", "POST"],
    credentials: true,
}));

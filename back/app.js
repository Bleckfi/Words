require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const sql = require('mssql');
const { registerUser, loginUser, getUserProfile } = require("./auth");
const authenticateJWT = require("./authenticateJWT.js");
let {connect, pool, on} = require("mssql/lib/global-connection");
const fs = require("fs");
const path = require("path");
const iconv = require("iconv-lite");

const wordsFilePath = path.join(__dirname, "./russian.txt");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const config = {
    user: 'Bleck',
    password: '123',
    server: 'PROGRAMMER',
    database: 'dbWords',
    options: {
        trustServerCertificate: true,
    },
};
const isWordValid = async (word) => {
    try {
        // Читаем файл как буфер
        const buffer = await fs.promises.readFile(wordsFilePath);

        // Декодируем буфер из ANSI (Windows-1251) в строку
        const data = iconv.decode(buffer, "windows-1251");

        // Разбиваем строку на массив слов и приводим к нижнему регистру
        const words = data.split("\n").map((w) => w.trim().toLowerCase());

        // Проверяем, есть ли слово в списке
        return words.includes(word.toLowerCase());
    } catch (error) {
        console.error("Ошибка при чтении файла:", error);
        return false; // Если произошла ошибка, возвращаем false
    }
};


async function initializePool() {
    try {
        pool = await sql.connect(config);
    } catch (error) {
        console.error("Ошибка при подключении к базе данных:", error);
        process.exit(1); // Завершаем процесс при невозможности подключиться
    }
}

// Вызовем инициализацию pool при запуске сервера
initializePool();


const validWords = ['яблоко','арбуз','зебра','олень','закат','трость','титан','нос','смысл','легко','овал'];
let usedWords = [];


// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

// Игровая логика
let games = {};

app.post("/register", registerUser);
app.post("/login", loginUser);
app.get('/profile', authenticateJWT, getUserProfile);
io.use(async (socket, next) => {
    const username = socket.handshake.auth.username; // Получаем имя пользователя из handshake
    console.log("Подключение пользователя с именем:", username);

    if (username) {
        try {
            const user = await findUserByUsername(username); // Найти пользователя в БД
            if (!user) {
                return next(new Error("Пользователь не найден"));
            }

            socket.user = { id: user.UserID, username: user.Username };
            console.log("Авторизация успешна:", socket.user);
            next();
        } catch (err) {
            console.error("Ошибка авторизации:", err.message);
            next(new Error("Ошибка авторизации"));
        }
    } else {
        // Если имя пользователя отсутствует, создаем гостевого пользователя
        const guestUsername = `Guest_${socket.id.substring(0, 6)}`;
        socket.user = { id: `guest_${socket.id}`, username: guestUsername };
        console.log("Подключился гость:", socket.user);
        next();
    }
});

async function findUserByUsername(username) {
    try {
        // Подключаемся к базе данных
        const pool = await connect(config);

        // Запрос для поиска пользователя по имени
        const result = await pool.request()
            .input('Username', sql.NVarChar, username)  // Защищаем запрос от SQL инъекций
            .query('SELECT UserID, Username FROM Users WHERE Username = @username');

        // Возвращаем найденного пользователя или null, если не найден
        if (result.recordset.length > 0) {
            return result.recordset[0];
        } else {
            return null;  // Если пользователь не найден
        }
    } catch (error) {
        console.error('Error while querying the database:', error);
        return null;  // Возвращаем null при ошибке
    }
}
io.on("connection", (socket) => {

    socket.on("join_game", (username) => {
        if (username) {
            socket.user.username = username;  // Присваиваем имя игроку
        }

        if (!socket.user.username) {
            socket.emit("error", { message: "Имя пользователя не задано!" });
            return;
        }

        const availableGame = Object.values(games).find(
            (game) => game.player2 === null
        );

        if (availableGame) {
            availableGame.player2 = socket.user;
            availableGame.state = "started";
            availableGame.turn = availableGame.player1.username;
            availableGame.timer = 30;
            availableGame.usedWords = [];

            socket.join(availableGame.id);
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
                usedWords: [],
            };
            socket.join(gameId);

            socket.emit("waiting", { message: "Ожидание еще одного игрока..." });
        }
    });


    socket.on("save_points", async (data) => {
        const { player1, player2 } = data;
        if (!pool) {
            socket.emit("error", { message: "Проблемы с подключением к базе данных!" });
            return;
        }

        try {
            const player1Points = parseInt(player1.points, 10);
            const player2Points = parseInt(player2.points, 10);

            if (isNaN(player1Points) || isNaN(player2Points)) {
                socket.emit("error", { message: "Некорректные очки!" });
                return;
            }

            const pool = await connect(config);

        } catch (error) {
            console.error("Ошибка при сохранении очков:", error);
            socket.emit("error", { message: "Не удалось сохранить очки!" });
        }
    });


    socket.on("submit_word", async (data) => {
        const { word } = data;

        const game = Object.values(games).find(
            (game) =>
                game.player1.id === socket.user.id ||
                (game.player2 && game.player2.id === socket.user.id)
        );

        if (!game || game.turn !== socket.user.username) return;

        const wordSubmitTime = 30 - game.timer; // Время, которое осталось на таймере (30 секунд - оставшееся время)
        let points = 0;

        if (wordSubmitTime <= 10) {
            points = 30; // Если слово введено за 10 секунд
        } else if (wordSubmitTime > 10 && wordSubmitTime <= 20) {
            points = 20; // Если слово введено за 10-20 секунд
        } else if (wordSubmitTime > 20 && wordSubmitTime < 30) {
            points = 5; // Если слово введено за 20-30 секунд
        }

        // Проверяем слово в текстовом файле
        const isValid = await isWordValid(word);
        if (!isValid) {
            socket.emit("invalid_word", "Такое слово не найдено");
            return;
        }

        if (game.usedWords.includes(word)) {
            socket.emit("invalid_word", "Это слово уже было использовано");
            return;
        }

        if (game.usedWords.length > 0) {
            const lastWord = game.usedWords[game.usedWords.length - 1];
            const lastLetter = lastWord.charAt(lastWord.length - 1);
            if (word.charAt(0).toLowerCase() !== lastLetter.toLowerCase()) {
                socket.emit("invalid_word", `Слово должно начинаться на букву: '${lastLetter}'.`);
                return;
            }
        }

        // Добавляем слово в список использованных слов
        game.usedWords.push(word);

        game.log.push(`${socket.user.username}: ${word} (Очки: ${points})`);

        game[socket.user.username] = (game[socket.user.username] || 0) + points;

        game.turn = game.turn === game.player1.username ? game.player2.username : game.player1.username;
        game.timer = 30;

        io.to(game.id).emit("game_update", {
            log: game.log,
            players: [game.player1.username, game.player2.username],
            turn: game.turn,
            timer: game.timer,
            scores: {
                [game.player1.username]: game[game.player1.username] || 0,
                [game.player2.username]: game[game.player2.username] || 0,
            },
        });
    });


    socket.on("game_over", async (data) => {
        const game = Object.values(games).find(
            (game) =>
                game.player1.id === socket.user.id ||
                (game.player2 && game.player2.id === socket.user.id)
        );
        const { player1, player2 } = game;
        const player1Points = game[player1.username] || 0;
        const player2Points = game[player2.username] || 0;
        console.log(game.player1, player1, player2, player2Points);
        try {
            console.log(`Очки зачислены: ${player1.username}: ${player1Points}, ${player2.username}: ${player2Points}`);

            // Отправка подтверждения на клиент
            io.to(game.id).emit("points_saved", { message: "Очки успешно зачислены!" });

        } catch (err) {
            console.error("Ошибка при сохранении очков:", err);
            io.to(game.id).emit("error", { message: "Ошибка при сохранении очков" });
        }
    });


    socket.on("disconnect", async () => {
        console.log(`Пользователь: ${socket.user.username} отключился`);

        const gameId = Object.keys(games).find(
            (id) =>
                games[id].player1.id === socket.user.id ||
                (games[id].player2 && games[id].player2.id === socket.user.id)
        );

        if (gameId) {
            const game = games[gameId];
            const { player1, player2 } = game;
            const player1Points = game[player1.username] || 0;
            const player2Points = game[player2.username] || 0;

            // Сохранение очков в БД
            try {
                await pool.request()
                    .input('points', sql.Int, player1Points)
                    .input('username', sql.NVarChar, player1.username)
                    .query('UPDATE Users SET total_points = total_points + @points WHERE Username = @username');

                await pool.request()
                    .input('points', sql.Int, player2Points)
                    .input('username', sql.NVarChar, player2.username)
                    .query('UPDATE Users SET total_points = total_points + @points WHERE Username = @username');


                console.log(`Очки зачислены: ${player1.username}: ${player1Points}, ${player2.username}: ${player2Points}`);
            } catch (err) {
                console.error("Ошибка при сохранении очков:", err);
            }

            // Очистка игры и удаление
            delete games[gameId];

            // Отправка сообщения о завершении игры
            io.to(gameId).emit("game_update", {
                log: [`Игрок ${socket.user.username} отключился, игра завершена.`],
            });
        }
    });

    const startTimer = (gameId) => {
        const interval = setInterval(async () => {
            const game = games[gameId];

            if (!game || game.state !== "started") {
                clearInterval(interval);
                return;
            }

            game.timer -= 1;

            if (game.timer === 0) {
                // Определяем победителя и проигравшего
                const winner = game.turn !== game.player1.username ? game.player1.username : game.player2.username;
                const loser = winner === game.player1.username ? game.player2.username : game.player1.username;

                console.log(`Победитель: ${winner}, Проигравший: ${loser}`);

                // Получаем очки игроков
                const player1Points = game[game.player1.username] || 0;
                const player2Points = game[game.player2.username] || 0;

                try {
                    // Начинаем транзакцию
                    const transaction = new sql.Transaction(pool);
                    await transaction.begin();

                    // Запрос на обновление данных победителя
                    const winnerUpdate = await transaction.request()
                        .input('winner', sql.NVarChar, winner)
                        .input('player1Points', sql.Int, player1Points)
                        .query(`
                        UPDATE Users SET total_points = total_points + @player1Points, Wins = Wins + 1
                        WHERE Username = @winner;
                    `);

                    if (winnerUpdate.rowsAffected[0] === 0) {
                        throw new Error(`Не удалось обновить данные победителя: ${winner}`);
                    }

                    // Запрос на обновление данных проигравшего
                    const loserUpdate = await transaction.request()
                        .input('loser', sql.NVarChar, loser)
                        .input('player2Points', sql.Int, player2Points)
                        .query(`
                        UPDATE Users SET total_points = total_points + @player2Points, Losses = Losses + 1
                        WHERE Username = @loser;
                    `);

                    if (loserUpdate.rowsAffected[0] === 0) {
                        throw new Error(`Не удалось обновить данные проигравшего: ${loser}`);
                    }

                    // Завершаем транзакцию
                    await transaction.commit();

                    console.log(`Победитель: ${winner} с очками: ${player1Points}`);
                    console.log(`Проигравший: ${loser} с очками: ${player2Points}`);

                } catch (error) {
                    console.error("Ошибка при сохранении данных в базе:", error);
                    await transaction.rollback();
                    io.to(gameId).emit("error", { message: "Ошибка при сохранении данных" });
                }

                // Отправляем сообщение о завершении игры
                io.to(gameId).emit("game_over", { message: `Выиграл ${winner}, Поздравляем!`, data: game });

                // Останавливаем таймер
                clearInterval(interval);

                // Удаляем игру из активных
                delete games[gameId];
            } else {
                io.to(game.id).emit("timer_update", { timer: game.timer });
            }
        }, 1000);
    };

});
app.get('/leaderboard', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`SELECT Username, total_points, Wins, Losses
            FROM Users
            ORDER BY total_points DESC;
`);
        res.json(result.recordset);
    } catch (error) {
        console.error("Ошибка при обработке запроса /leaderboard:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});


// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Конфигурация подключения
const config = {
    user: 'Bleck',
    password: '123',
    server: 'PROGRAMMER',
    database: 'dbWords',
    options: {
        trustServerCertificate: true,
    },
};

// Создание пула соединений
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => console.error('Database connection failed:', err));

// Регистрация пользователя
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const pool = await poolPromise;

        // Проверка существующих пользователей
        const existingUsers = await pool.request()
            .query`SELECT UserID FROM Users WHERE Email = ${email} OR Username = ${username}`;

        if (existingUsers.recordset.length > 0) {
            return res.status(400).json({ error: "Email or username already exists!" });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Добавление нового пользователя
        await pool.request()
            .query`INSERT INTO Users (Email, Username, PasswordHash) VALUES (${email}, ${username}, ${hashedPassword})`;

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Error registering user!" });
    }
};

// Вход пользователя
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;

        // Получение информации о пользователе
        const users = await pool.request()
            .query`SELECT * FROM Users WHERE Email = ${email}`;

        if (users.recordset.length === 0) {
            return res.status(404).json({ error: "User not found!" });
        }

        const user = users.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password!" });
        }

        const token = jwt.sign(
            { id: user.UserID, email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const username = user.Username;

        res.status(200).json({ message: "Login successful!", token, username });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error!" });
    }
};

const getUserProfile = async (req, res) => {
    const userId = req.user.id;  // Получаем идентификатор пользователя из токена

    try {
        const pool = await poolPromise;  // Создаем пул соединений с базой данных

        // Запрашиваем профиль пользователя из таблицы Users (только имя)
        const userProfile = await pool.request()
            .query`SELECT Username FROM Users WHERE UserID = ${userId}`;

        // Запрашиваем данные о счете пользователя из таблицы ScoreBoard
        const userScore = await pool.request()
            .query`SELECT Wins, Losses, total_points FROM Users WHERE UserID = ${userId}`;

        // Если профиль пользователя не найден
        if (userProfile.recordset.length === 0) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Если данные о счете не найдены, создаем значения по умолчанию
        const wins = userScore.recordset[0]?.Wins || 0;
        const losses = userScore.recordset[0]?.Losses || 0;
        const score = userScore.recordset[0]?.total_points || 0
        // Вычисляем winRate
        const winRate = ((wins / (wins + losses)) * 100).toFixed(2);

        res.status(200).json({
            username: userProfile.recordset[0].Username,
            winRate: winRate,
            wins: wins,
            losses: losses,
            score : score
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error!" });
    }
};


module.exports = { registerUser, loginUser, getUserProfile };
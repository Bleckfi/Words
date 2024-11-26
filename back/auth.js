const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Connection, Request, TYPES } = require("tedious");

// Конфигурация подключения
const config = {
    server: "PROGRAMMER",
    authentication: {
        type: "default", // Используйте NTLM для Windows Authentication
        options: {
            domain: "PROGRAMMER", // Имя домена или компьютера
            userName: "Bleck", // Ваш Windows-логин
            password: "123", // Пароль Windows-учетной записи
        },
    },
    options: {
        trustServerCertificate: true,
        database: "dbWords",
    },
};

// Функция для выполнения запросов
const executeQuery = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);

        connection.on("connect", (err) => {
            if (err) {
                console.error("Connection error:", err);
                return reject(err);
            }

            const request = new Request(query, (err, rowCount, rows) => {
                if (err) {
                    console.error("Request error:", err);
                    return reject(err);
                }

                const results = [];
                rows.forEach((columns) => {
                    const result = {};
                    columns.forEach((column) => {
                        result[column.metadata.colName] = column.value;
                    });
                    results.push(result);
                });

                resolve(results);
                connection.close();  // Закрытие соединения после выполнения запроса
            });

            // Добавление параметров в запрос
            parameters.forEach(({ name, type, value }) => {
                try {
                    request.addParameter(name, type, value);
                } catch (err) {
                    console.error("Error adding parameter:", err);
                    reject(err);
                }
            });

            connection.execSql(request);
        });

        connection.on("error", (err) => {
            console.error("Connection error:", err);
            reject(err);
        });

        // Открытие соединения
        connection.connect();
    });
};

// Регистрация пользователя
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        // Проверка на существование пользователя по email или username
        const existingUsers = await executeQuery(
            "SELECT UserID FROM users WHERE email = @Email OR username = @Username",
            [
                { name: "Email", type: TYPES.NVarChar, value: email.trim() },
                { name: "Username", type: TYPES.NVarChar, value: username.trim() }
            ]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email or username already exists!" });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Добавление нового пользователя
        await executeQuery(
            "INSERT INTO users (email, username, PasswordHash) VALUES (@Email, @Username, @PasswordHash)",
            [
                { name: 'Email', type: TYPES.NVarChar, value: email.trim() },
                { name: 'Username', type: TYPES.NVarChar, value: username.trim() },
                { name: 'PasswordHash', type: TYPES.NVarChar, value: hashedPassword }
            ]
        );

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Error registering user!" });
    }
};

// Вход пользователя
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    console.log("Received login request:", { email, password });

    try {
        // Поиск пользователя с игнорированием регистра
        const users = await executeQuery(
            "SELECT * FROM Users WHERE email = @Email",
            [{ name: 'email', type: TYPES.NVarChar, value: email.trim() }]
        );

        console.log("Users found:", users);

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found!" });
        }

        const user = users[0];
        console.log("User found:", user);

        // Проверяем правильность пароля
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password!" });
        }

        // Генерация токена
        const token = jwt.sign(
            { id: user.UserID, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful!", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error!" });
    }
};

module.exports = { registerUser, loginUser };

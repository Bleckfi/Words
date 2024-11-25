const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sql = require("mssql");

const config = {
    user: "your_username",
    password: "your_password",
    server: "PROGRAMMER",
    database: "dbWords",
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await sql.connect(config);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Вставка пользователя в таблицу
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .query('INSERT INTO users (username, password_hash) VALUES (@username, @password_hash)');

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Error registering user!" });
    }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');

        const user = result.recordset[0];
        if (!user) return res.status(404).json({ error: "User not found!" });

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid password!" });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ message: "Login successful!", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error!" });
    }
};

module.exports = { registerUser, loginUser };

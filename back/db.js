const { Connection } = require("tedious");

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

const connectToDB = () => {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);

        connection.on("connect", (err) => {
            if (err) {
                console.error("Database connection failed:", err);
                return reject(err);
            }

            console.log("Connected to the database");
            resolve(connection);
        });

        connection.connect();
    });
};

module.exports = { connectToDB };

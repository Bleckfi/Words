const sql = require("mssql");

const config = {
    user: "PROGRAMMER\\PC",    // Имя пользователя SQL Server
    password: "",   // Пароль
    server: "PROGRAMMER",        // Имя хоста или IP-адрес сервера
    database: "dbWords",         // Имя базы данных
    options: {
        encrypt: false,           // Для защищенного подключения (если требуется)
        trustServerCertificate: true, // Для работы с самоподписанными сертификатами
    }
};

async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log("Connected to SQL Server successfully!");
    } catch (err) {
        console.error("Error connecting to SQL Server:", err);
    }
}

connectToDatabase();

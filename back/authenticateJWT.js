const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Извлекаем токен из заголовка Authorization

    if (!token) {
        return res.sendStatus(403); // Запрещено, если токен отсутствует
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Проверяем токен
        if (err) {
            return res.sendStatus(403); // Запрещено, если токен недействителен
        }

        req.user = user; // Сохраняем информацию о пользователе в объекте запроса
        next(); // Переходим к следующему middleware или маршруту
    });
};

module.exports = authenticateJWT; // Экспортируем middleware
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate(); // Хук для навигации

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isRegister) {
            // Регистрация
            try {
                const response = await axios.post("http://localhost:3000/register", {
                    email,
                    password,
                    username,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status === 201) {
                    alert("Регистрация успешна!");
                    setIsRegister(false); // Смена режима на авторизацию
                }
            } catch (error) {
                // Обработка ошибок
                if (error.response) {
                    alert(error.response.data.error || "Данный пользователь уже зарегистрирован");
                } else {
                    alert("Произошла ошибка. Пожалуйста, попробуйте снова.");
                }
                console.error("Error:", error);
            }
        } else {
            // Авторизация
            try {
                const response = await axios.post("http://localhost:3000/login", {
                    email,
                    password,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status === 200) {
                    alert("Успешная авторизация!");
                    localStorage.setItem('token', response.data.token); // Сохранение токена в localStorage
                    localStorage.setItem("username", response.data.username);
                    console.log(response.data);
                    navigate("/profile"); // Перенаправление на страницу профиля
                }
            } catch (error) {
                // Обработка ошибок
                if (error.response) {
                    console.log(error.response.data);
                    alert(error.response.data.error || "Ошибка входа");
                } else {
                    alert("Произошла ошибка. Пожалуйста, попробуйте снова.");
                }
                console.error("Error:", error);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="form-container">
                <h2>{isRegister ? "Регистрация" : "Авторизация"}</h2>
                <form onSubmit={handleSubmit} className="glass-form">
                    {isRegister && ( // Поле "Nickname" показывается только при регистрации
                        <input
                            type="text"
                            placeholder="Псевдоним"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Почта"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">{isRegister ? "Регистрация" : "Авторизация"}</button>
                    <a href={"/game"}>
                        <button type="button">Войти как гость</button>
                    </a>
                </form>
                <button
                    className="switch-button"
                    onClick={() => setIsRegister(!isRegister)}
                >
                    {isRegister ? "Поменять на авторизацию" : "Поменять на регистрацию"}
                </button>
            </div>
        </div>
    );
}

export default Auth;
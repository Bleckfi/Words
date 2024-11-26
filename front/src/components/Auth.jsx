import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isRegister) {
            console.log(isRegister);
            try {
                const response = await axios.post("http://localhost:3000/register", {
                    email,
                    password,
                    nickname,
                });

                if (response.status === 201) {
                    alert("Registration successful!");
                    setIsRegister(false);
                }
            } catch (error) {
                // Обработка ошибок
                if (error.response) {
                    alert(error.response.data.error || "Registration failed.");
                } else {
                    alert("An error occurred. Please try again.");
                }
                console.error("Error:", error);
            }
        } else {
            try {
                const response = await axios.post("http://localhost:3000/login", {
                    email,
                    password,
                });

                if (response.status === 200) {
                    alert("Login successful!");
                }
            } catch (error) {
                // Обработка ошибок
                if (error.response) {
                    alert(error.response.data.error || "Login failed.");
                } else {
                    alert("An error occurred. Please try again.");
                }
                console.error("Error:", error);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="form-container">
                <h2>{isRegister ? "Register" : "Login"}</h2>
                <form onSubmit={handleSubmit} className="glass-form">
                    {isRegister && ( // Поле "Nickname" показывается только при регистрации
                        <input
                            type="text"
                            placeholder="Nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email} // Используем правильную переменную для email
                        onChange={(e) => setEmail(e.target.value)} // Исправленный обработчик
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">{isRegister ? "Register" : "Login"}</button>
                </form>
                <button
                    className="switch-button"
                    onClick={() => setIsRegister(!isRegister)}
                >
                    {isRegister ? "Switch to Login" : "Switch to Register"}
                </button>
            </div>
        </div>
    );
}

export default Auth;

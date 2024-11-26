import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

function Game() {
    const [word, setWord] = useState("");
    const [log, setLog] = useState([]);
    const [timer, setTimer] = useState(30);
    const [players, setPlayers] = useState([]);
    const [turn, setTurn] = useState("");
    const [username, setUsername] = useState("");
    const [gameOverMessage, setGameOverMessage] = useState("");
    const [waitingForName, setWaitingForName] = useState(true); // Состояние для ожидания ввода имени
    const [errorMessage, setErrorMessage] = useState(""); // Для отображения ошибки

    const navigate = useNavigate();
    const socket = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        socket.current = io("http://localhost:3000", {
            auth: { token },
        });

        socket.current.on("connect", () => {
            // Подключение завершено, но имя будет отправлено только после ввода
        });

        socket.current.on("waiting", (data) => {
            setLog([data.message]);
        });

        socket.current.on("game_update", (data) => {
            setLog(data.log);
            setPlayers(data.players);
            setTurn(data.turn); // Обновляем текущее имя игрока, чей ход
            setTimer(data.timer);
        });

        socket.current.on("timer_update", (data) => {
            setTimer(data.timer);
        });

        socket.current.on("game_over", (data) => {
            setGameOverMessage(data.message);
        });

        socket.current.on("invalid_word", (message) => {
            setErrorMessage(message); // Отображаем сообщение об ошибке
        });

        socket.current.on("disconnect", () => {
            alert("Disconnected from the server!");
            navigate("/");
        });

        return () => socket.current.disconnect();
    }, [navigate]);

    const handleNameSubmit = () => {
        if (username) {
            setWaitingForName(false); // Скрыть форму после ввода имени
            socket.current.emit("join_game", username); // Отправить имя на сервер
        }
    };

    const submitWord = () => {
        if (word && turn === username) {
            socket.current.emit("submit_word", { word });
            setWord("");
            setErrorMessage(""); // Сброс ошибки после отправки слова
        }
    };

    if (waitingForName) {
        return (
            <div>
                <h1>Enter Your Name</h1>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                />
                <button onClick={handleNameSubmit}>Join Game</button>
            </div>
        );
    }

    if (!socket.current || !turn) {
        return <div>Connecting to the game...</div>;
    }

    return (
        <div>
            <h1>Word Game</h1>
            {gameOverMessage && <div><strong>Game Over:</strong> {gameOverMessage}</div>}
            <div>
                <strong>Timer:</strong> {timer}s
            </div>
            <div>
                <strong>Players:</strong> {players.join(" vs ")}
            </div>
            <div>
                <strong>Your name:</strong> {username}
            </div>
            <div>
                <strong>Current turn:</strong> {turn}
            </div>
            <textarea
                value={log.join("\n")}
                readOnly
                rows={10}
                cols={50}
            />
            <div>
                {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>} {/* Отображаем ошибку */}
                <input
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Enter your word"
                    disabled={turn !== username}
                />
                <button onClick={submitWord} disabled={turn !== username}>
                    Submit
                </button>
            </div>
        </div>
    );
}

export default Game;

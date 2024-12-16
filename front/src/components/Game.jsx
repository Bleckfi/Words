import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "../styles/game.css";
import profile from "./Profile.jsx";

function Game() {
    const [word, setWord] = useState("");
    const [log, setLog] = useState([]);
    const [timer, setTimer] = useState(30);
    const [players, setPlayers] = useState([]);
    const [turn, setTurn] = useState("");
    const [username, setUsername] = useState("");
    const [gameOverMessage, setGameOverMessage] = useState("");
    const [waitingForName, setWaitingForName] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [player1Points, setPlayer1Points] = useState(0);
    const [player2Points, setPlayer2Points] = useState(0);
    const lastWord = log[log.length - 1]; // Последнее слово в логе
    const lastLetter = lastWord ? lastWord.charAt(lastWord.length - 1).toUpperCase() : '';
    let player1 = ''
    let player2 = ''


    const navigate = useNavigate();
    const socket = useRef(null);
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");

        if (storedUsername) {
            setUsername(storedUsername);
            setWaitingForName(false); // Пропускаем ввод имени, если оно уже сохранено
        }

        // Создание сокета с переданным именем пользователя
        socket.current = io('http://localhost:3000', {
            auth: { username: storedUsername }, // Передаем имя пользователя на сервер
        });

        socket.current.on("connect", () => {
            if (storedUsername) {
                socket.current.emit("join_game", storedUsername); // Присоединяемся с именем из localStorage
            }
        });

        socket.current.on("waiting", (data) => {
            setLog([data.message]);
        });

        socket.current.on("game_update", (data) => {
            setLog(data.log);
            setPlayers(data.players);
            setTurn(data.turn);
            setTimer(data.timer);

            if (data.scores && data.players && data.players.length >= 2) {
                setPlayer1Points(data.scores[data.players[0]] || 0);
                setPlayer2Points(data.scores[data.players[1]] || 0);
            }
        });

        socket.current.on("timer_update", (data) => {
            setTimer(data.timer);
        });

        socket.current.on("game_over", (data) => {
            setGameOverMessage(data.message);

            // После получения окончания игры
            setTimeout(() => {
                const winner = data.winner;
                const loser = data.loser;

                // Вызов функции для сохранения очков победителя и проигравшего
                savePoints(winner, loser);

                // Переход на страницу профиля через 3 секунды
                setTimeout(() => navigate("/profile"), 3000);
            }, 100);
        });

        socket.current.on("invalid_word", (message) => {
            setErrorMessage(message); // Отображаем сообщение об ошибке
        });

        socket.current.on("disconnect", () => {
            alert("Disconnected from the server!");
            navigate("/profile");
        });

        return () => {
            socket.current.disconnect();
        };
    }, [navigate]);

// Функция для отправки очков победителя и проигравшего на сервер
    const savePoints = (winner, loser) => {
        socket.current.emit("save_points", {
            winner: { username: winner, points: 0 },
            loser: { username: loser, points: 0 }
        });
    };




    const handleNameSubmit = () => {
        if (username) {
            localStorage.setItem("username", username);
            setWaitingForName(false);
            socket.current.emit("join_game", username);
        }
    };

    const submitWord = () => {
        if (word && turn === username) {
            socket.current.emit("submit_word", { word });
            setWord("");
            setErrorMessage(""); // Сброс ошибки после отправки слова
        } else {
            setErrorMessage("Введите слово, которое соответствует правилам.");
        }
    };

    if (waitingForName) {
        return (
            <div>
                <h1>Введите имя</h1>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите имя"
                />
                <button onClick={handleNameSubmit}>Присоединиться к игре</button>
            </div>
        );
    }

    return (
        <div className="game">
            <h1 className="title">Word Game</h1>
            {gameOverMessage && (
                <div className="game_over">{gameOverMessage}</div>
            )}
            <div className="timer">{timer}</div>
            <div className="players">{players.join(" vs ")}</div>
            <div className="current_turn">
                <strong>Сейчас ходит:</strong> {turn}
            </div>
            <div className="current_turn">
                <div>{players[0]}: {player1Points}</div>
                <div>{players[1]}: {player2Points}</div>
            </div>
            <div className="letter">Буква текущего слова должна начинаться с: {lastLetter}</div>
            <textarea
                className="text_game"
                value={log.join("\n")}
                readOnly
                rows={15}
                cols={70}
            />
            <div className="button_game">
                {errorMessage && <div style={{color: "red"}}>{errorMessage}</div>}
                <input
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Введите слово"
                    disabled={turn !== username}
                />
                <button onClick={submitWord} disabled={turn !== username}>
                    Отправить
                </button>
            </div>
        </div>
    );
}

export default Game;

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

function Game() {
    const [word, setWord] = useState("");
    const [timer, setTimer] = useState(30);
    const [log, setLog] = useState([]);
    const [winner, setWinner] = useState("");
    const [waiting, setWaiting] = useState(true);

    const navigate = useNavigate();
    const socket = useRef(null); // Используем useRef для хранения socket

    useEffect(() => {
        // Инициализация WebSocket-соединения
        const token = localStorage.getItem("token");
        socket.current = io("http://localhost:3000", {
            auth: { token },
        });

        socket.current.on("connect", () => {
            console.log("Connected to the server!");
            socket.current.emit("join_game");
        });

        socket.current.on("waiting", (data) => {
            setWaiting(true);
            console.log(data.message);
        });

        socket.current.on("game_update", (data) => {
            setWaiting(false);
            setLog(data.log);
            setTimer(data.timer);
        });

        socket.current.on("game_over", (data) => {
            setWinner(data.winner);
            console.log(`Game Over! Winner: ${data.winner}`);
        });

        socket.current.on("disconnect", () => {
            console.log("Disconnected from the server!");
        });

        socket.current.on("error", (err) => {
            console.error(err);
            alert("Authentication failed, redirecting to login.");
            navigate("/");
        });

        return () => socket.current.disconnect(); // Очистка при размонтировании компонента
    }, [navigate]);

    const submitWord = () => {
        if (word) {
            socket.current.emit("submit_word", { word }); // Используем socket.current
            setWord("");
        }
    };

    if (waiting) return <h1>Waiting for another player...</h1>;
    if (winner) return <h1>Game Over! Winner: {winner}</h1>;

    return (
        <div>
            <h1>Word Game</h1>
            <div>Timer: {timer}s</div>
            <div>
                <input
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Enter a word"
                />
                <button onClick={submitWord}>Submit</button>
            </div>
            <h2>Log:</h2>
            <ul>
                {log.map((entry, index) => (
                    <li key={index}>{entry}</li>
                ))}
            </ul>
        </div>
    );
}

export default Game;

import React, { useState } from "react";
import "../styles/wordManager.css";

function WordManager() {
    const [word, setWord] = useState("");
    const [deleteWord, setDeleteWord] = useState("");
    const [message, setMessage] = useState("");

    const handleAddWord = async (e) => {
        e.preventDefault();
        if (word.trim() === "") {
            setMessage("Введите слово перед добавлением!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/add_word", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word }),
            });

            const data = await response.json();
            setMessage(data.message);
            setWord("");
        } catch (error) {
            console.error("Ошибка при добавлении слова:", error);
            setMessage("Ошибка при добавлении слова.");
        }
    };

    const handleDeleteWord = async (e) => {
        e.preventDefault();
        if (deleteWord.trim() === "") {
            setMessage("Введите слово перед удалением!");
            return;
        }
        try {
            const response = await fetch("http://localhost:3000/delete_word", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: deleteWord }),
            });

            const data = await response.json();
            setMessage(data.message);
            setDeleteWord("");
        } catch (error) {
            console.error("Ошибка при удалении слова:", error);
            setMessage("Ошибка при удалении слова.");
        }
    };

    return (
        <div className="word-manager-container">
            <h1>Управление Словарём</h1>
            {message && <div className="message">{message}</div>}

            {/* Форма добавления слова */}
            <form className="word-form" onSubmit={handleAddWord}>
                <h2>Добавить Слово</h2>
                <input
                    type="text"
                    placeholder="Введите новое слово"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                />
                <button type="submit" className="add-button">Добавить</button>
            </form>

            {/* Форма удаления слова */}
            <form className="word-form" onSubmit={handleDeleteWord}>
                <h2>Удалить Слово</h2>
                <input
                    type="text"
                    placeholder="Введите слово для удаления"
                    value={deleteWord}
                    onChange={(e) => setDeleteWord(e.target.value)}
                />
                <button type="submit" className="delete-button">Удалить</button>
            </form>
        </div>
    );
}

export default WordManager;

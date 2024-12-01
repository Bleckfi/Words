import React, { useState } from "react";
import "../styles/wordManager.css";

function WordManager() {
    const [word, setWord] = useState("");
    const [deleteWord, setDeleteWord] = useState("");
    const [message, setMessage] = useState("");

    const handleAddWord = (e) => {
        e.preventDefault();
        if (word.trim() === "") {
            setMessage("Введите слово перед добавлением!");
            return;
        }
        setMessage(`Слово "${word}" успешно добавлено!`);
        setWord(""); // Очистить поле ввода
    };

    const handleDeleteWord = (e) => {
        e.preventDefault();
        if (deleteWord.trim() === "") {
            setMessage("Введите слово перед удалением!");
            return;
        }
        setMessage(`Слово "${deleteWord}" успешно удалено!`);
        setDeleteWord(""); // Очистить поле ввода
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

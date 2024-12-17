import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import axios from "axios";

function Profile() {
    const [avatar, setAvatar] = useState("https://w7.pngwing.com/pngs/181/895/png-transparent-uganda-performing-right-society-computer-icons-user-distinguished-guest-miscellaneous-silhouette-meditation-thumbnail.png"); // Храним текущую аватарку
    const avatars = [
        "https://e7.pngegg.com/pngimages/734/409/png-clipart-lion-cartoon-lion-cartoon-animal-animal-nature-predator-feline-cartoon-icon.png",
        "https://cs6.livemaster.ru/storage/51/8d/e9304e78c01418b5ea956d3be36a.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLCQgWsQ6kTgVyERmWiWCM83Lj2Bz3bqcgUA&s"]; // Примеры аватарок

    const [userInfo, setUserInfo] = useState(null); // Храним данные пользователя
    const [loading, setLoading] = useState(true); // Для индикатора загрузки
    const [leaderboard, setLeaderboard] = useState([]); // Храним данные для таблицы лидеров

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:3000/profile", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}` // Передаем токен
                    }
                });
                setUserInfo(response.data); // Устанавливаем данные пользователя
                localStorage.setItem("username", response.data.username);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchLeaderboard = async () => {
            try {
                const response = await axios.get("http://localhost:3000/leaderboard");
                if (response.status === 200) {
                    setLeaderboard(response.data);
                } else {
                    console.error("Ошибка сервера:", response.status);
                    alert("Ошибка при загрузке таблицы лидеров.");
                }
            } catch (error) {
                console.error("Ошибка при запросе данных:", error);
                alert("Не удалось загрузить данные таблицы лидеров. Попробуйте позже.");
            }
        };

        fetchUserData();
        fetchLeaderboard();
    }, []);

    const handleAvatarChange = (newAvatar) => {
        setAvatar(newAvatar);
    };

    if (loading) {
        return <div>Loading...</div>; // Индикатор загрузки
    }

    const wins = userInfo?.wins || 0;
    const losses = userInfo?.losses || 0;
    const winRate = (wins + losses) === 0 ? 0 : ((wins / (wins + losses)) * 100).toFixed(2); // Вычисляем винрейт
    const score = userInfo?.score || 0;

    if (userInfo.username === "ADMIN") {
        userInfo.isAdmin = true
    }

    // Сортировка таблицы по очкам
    const sortedLeaderboard = leaderboard.sort((a, b) => b.score - a.score);

    return (
        <div className="container">
            <div className="text_container">
                <div className="container_Side">
                    <div className="left">
                        <div className="user_info">
                            <img src={avatar} alt="User Avatar" className="avatar" />
                            <span className="user_name">Ваше имя: {userInfo.username}</span>
                            <div className="avatar_selector">
                                <div className="avatars">
                                    {avatars.map((avatarOption, index) => (
                                        <img
                                            key={index}
                                            src={avatarOption}
                                            alt={`Avatar ${index + 1}`}
                                            className="avatar_option"
                                            onClick={() => handleAvatarChange(avatarOption)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="wins">Количество побед/поражений: {wins} / {losses} ({winRate}%)</div>
                        <div className="score">Количество очков: {score}</div>
                        <a href="/game" className="button">Начать игру</a>
                        {userInfo.isAdmin && (
                            <div>
                                <a href="/edit" className="button">Редактировать словарь</a>
                            </div>
                        )}
                    </div>
                    <div className="right">
                        <table>
                            <thead>
                            <tr>
                                <th>Место</th>
                                <th>Имя</th>
                                <th>Очки</th>
                                <th>Процент Побед</th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedLeaderboard.map((user, index) => {

                                const winRate = (user.Wins + user.Losses) === 0 ? 0 : ((user.Wins / (user.Wins + user.Losses)) * 100).toFixed(2);
                                return (
                                    <tr key={user.Username}>
                                        <td>{index + 1}</td>
                                        <td>{user.Username}</td>
                                        <td>{user.total_points}</td>
                                        <td>{winRate}%</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

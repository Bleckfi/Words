import React, { useState } from "react";
import "../styles/profile.css";

function Profile() {
    const [avatar, setAvatar] = useState("https://w7.pngwing.com/pngs/181/895/png-transparent-uganda-performing-right-society-computer-icons-user-distinguished-guest-miscellaneous-silhouette-meditation-thumbnail.png"); // Храним текущую аватарку

    const avatars = [
        "https://e7.pngegg.com/pngimages/734/409/png-clipart-lion-cartoon-lion-cartoon-animal-animal-nature-predator-feline-cartoon-icon.png",
        "https://cs6.livemaster.ru/storage/51/8d/e9304e78c01418b5ea956d3be36a.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLCQgWsQ6kTgVyERmWiWCM83Lj2Bz3bqcgUA&s"]; // Примеры аватарок

    const handleAvatarChange = (newAvatar) => {
        setAvatar(newAvatar);
    };

    return (
        <div className="container">
            <div className="text_container">
                <div className="container_Side">
                    <div className="left">
                        <div className="user_info">
                            <img
                                src={avatar}
                                alt="User Avatar"
                                className="avatar"
                            />
                            <span className="user_name">Ваше имя: Sasha</span>
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
                        <div className="wins">Количество побед/поражений: 13 / 5 (63%)</div>
                        <div className="score">Количество очков: 156123</div>
                        <a href="/game" className="button">Начать игру</a>
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
                            <tr>
                                <td>1</td>
                                <td>Иван</td>
                                <td>250</td>
                                <td>80%</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Profile;

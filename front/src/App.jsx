import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Game from "./components/Game";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Profile from "./components/Profile.jsx";
import WordManager from "./components/WordManager.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route
                    path="/game"
                    element={
             //          <ProtectedRoute>
                            <Game />
              //          </ProtectedRoute>
                    }
                />
                <Route path={"/profile"} element={
                  //  <ProtectedRoute>
                        <Profile />
                   // </ProtectedRoute>
                }/>
                <Route path={"/edit"} element={
                //  <ProtectedRoute>
                <WordManager />
                // </ProtectedRoute>
            }/>

            </Routes>
        </Router>
    );
}

export default App;

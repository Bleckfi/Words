import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Game from "./components/Game";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route
                    path="/game"
                    element={
                      //  <ProtectedRoute>
                            <Game />
                       // </ProtectedRoute>
                    }
                />

            </Routes>
        </Router>
    );
}

export default App;
